/* 
该文件定义应用的主窗口并加载预加载脚本
 */
const { app, BrowserWindow, Menu, screen, ipcMain,dialog } = require('electron');
const path = require('path');
const Store = require("electron-store");

const store = new Store();
let mainWindow;

function createWindow() {
    const { width, height } = screen.getPrimaryDisplay().workAreaSize; // 获取工作区域尺寸（排除任务栏）
    // 创建浏览器窗口
    mainWindow = new BrowserWindow({
        // width: width * 0.8,
        // height: height * 0.8,
        // windows支持的最小有效尺寸
        width: 600,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'), // 启用预加载脚本
            /* 
                控制渲染进程的 JavaScript 上下文是否与主进程隔离。启用后，预加载脚本（preload.js）通过 contextBridge暴露的 API 才能安全传递到渲染进程，避免恶意代码直接访问 Node.js 或 Electron API
                Electron 12+ 默认为 true，旧版本默认为 false
                若设为 false，渲染进程可通过 window.require直接访问 Node.js 模块，存在安全风险
            */
            // contextIsolation: true,
            /* 
                是否允许渲染进程使用 remote模块（如 require('electron').remote）。该模块已废弃，因其允许渲染进程直接调用主进程 API，可能导致安全漏洞
                Electron 10+ 默认为 false，旧版本默认为 true
                通过 ipcRenderer和 ipcMain进行进程间通信（IPC）
            */
            // enableRemoteModule: false,
            /* 
                是否允许渲染进程使用 Node.js API（如 require、process）。启用后，渲染进程可直接调用 Node.js 模块
                默认为 false。若设为 true，需配合 contextIsolation: false使用，但会降低安全性
            */
            nodeIntegration: true, // 使用noptyf请开启
        }
    });

    // 隐藏默认菜单栏（可选）
    // Menu.setApplicationMenu(null);
    // 加载本地 HTML 文件
    mainWindow.loadFile('index.html');
    // IPC 注册
    IPCRegister(mainWindow);
    // 开发模式下打开开发者工具（可选）
    // mainWindow.webContents.openDevTools();

}
function createListWindow(data) {
    console.log('data:', data);
    const listWin = new BrowserWindow({
        width: 600,
        height: 800,
        parent: BrowserWindow.getFocusedWindow(), // 设置父窗口
        modal: true, // 模态窗口（主窗口失焦）
        show: false,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: true, // 使用noptyf请开启
            sandbox: false,
        },
    });
    listWin.loadFile('pwd-list.html');

    // listWin.webContents.openDevTools();
    listWin.once('ready-to-show', () => {
        console.log('ready-to-show...');
        listWin.show();
        // listWin.webContents.send('init-data', dataList); // 初始化数据
    });
    // 刷新回调
    listWin.webContents.on('did-finish-load', () => {
        console.log('did-finish-load...');
        // listWin.webContents.send('init-data', dataList);
    });
}
// open-add-password-window
function createAddPasswordWindow(data) {
    console.log('data:', data);
    const addPwdWin = new BrowserWindow({
        width: 600,
        height: 800,
        parent: BrowserWindow.getFocusedWindow(), // 设置父窗口
        modal: true, // 模态窗口（主窗口失焦）
        show: false,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: true, // 使用noptyf请开启
            sandbox: false,
        },
    });
    addPwdWin.loadFile('add-pwd-item.html');

    // addPwdWin.webContents.openDevTools();
    addPwdWin.once('ready-to-show', () => {
        addPwdWin.show();
        addPwdWin.webContents.send('init-data-add-pwd-item', data); // 初始化数据
    });
}


// Electron 初始化完成后创建窗口
app.whenReady().then(createWindow);

// 引入加密模块
const crypto = require('crypto');
const fs = require('fs').promises;

function IPCRegister(win) {
    // 检测当前环境（开发环境或生产环境）
    const isDev = !app.isPackaged;
    
    // 提供环境信息给渲染进程
    ipcMain.handle('is-dev-environment', () => isDev);
    ipcMain.handle('store-get', (event, key) => {
        console.log('[store-get]：', key);
        return store.get(key); // 获取存储的值
    });
    ipcMain.on('store-set', (event, key, value) => {
        console.log('[store-set]：', key, value);
        store.set(key, value); // 设置存储的值
    });
    ipcMain.handle('show-store', (event) => {
        console.log('[show-store]：', store.store);
        return store.store; // 获取存储的值
    });
    ipcMain.handle('add-pwd-record', (event, record) => {
        const list = store.get('pwdRecords', []);
        let result = list.some(item => item.id === record.id);
        if (result) return false; // 如果已存在则不添加
        // 加入新记录
        list.push(record);
        // 写回 Store
        store.set('pwdRecords', list);
        return true; // 返回添加成功
    });
    ipcMain.handle('modify-pwd-record', (event, record) => {
        // 将record.id 相同的数据项替换为传入的record
        const list = store.get('pwdRecords', []);
        const index = list.findIndex(item => item.id === record.id);
        list[index] = record;
        store.set('pwdRecords', list);
    })
    ipcMain.handle('delete-pwd-record', (event, record) => {
        // 1. 获取原始列表
        const list = store.get('pwdRecords', []);
        // 2. 过滤出非匹配项
        const newList = list.filter(item => item.id !== record.id);
        // 3. 保存回 store
        store.set('pwdRecords', newList);
    });
    // 窗口只传递不变动的元数据，需要变动的使用接口通过ICP动态获取
    ipcMain.handle('open-list-window', (event, data) => {
        createListWindow(data || null);
    });
    ipcMain.handle('open-add-password-window', (event, data) => {
        createAddPasswordWindow(data || null);
    });
    ipcMain.handle('get-current-dataList', () => {
        return currentDataList;
    });
    ipcMain.handle('reset-store', (event) => {
        try {
            store.clear();
        } catch (error) {
            console.error('Error clearing store:', error);
            return false;
        }
        return true;
    });
    // 确认框  确认1 => True 取消0 => False
    ipcMain.handle('confirm-delete', async (event,msg) => {
        const { response } = await dialog.showMessageBox({
            type: 'question',
            buttons: ['取消', '确定'],
            defaultId: 1,
            cancelId: 0,
            title: msg.title || '确认操作',
            message: msg.message || '你确定要继续执行此操作吗？',
            detail: msg.detail || '此操作不可撤销。',
        });
        return response === 1;
    });
    // 导出密码
    ipcMain.handle('export-passwords', async (event, passwords) => {
        try {
            // 打开保存对话框
            const { filePath, canceled } = await dialog.showSaveDialog({
                title: '导出密码',
                defaultPath: `pwd_export_${new Date().toISOString().slice(0, 10)}.json`,
                filters: [
                    { name: 'JSON Files', extensions: ['json'] },
                    { name: 'All Files', extensions: ['*'] }
                ]
            });
            
            if (canceled || !filePath) {
                return false;
            }
            
            // 加密密码数据
            const ENCRYPTION_KEY = 'PwdNoteMasterKey'; // 可以让用户自定义，这里使用默认密钥
            const IV_LENGTH = 16; // 初始化向量长度
            const iv = crypto.randomBytes(IV_LENGTH);
            const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY.padEnd(32, '0'), 'utf8'), iv);
            const jsonData = JSON.stringify(passwords, null, 2);
            let encrypted = cipher.update(jsonData);
            encrypted = Buffer.concat([encrypted, cipher.final()]);
            const encryptedData = iv.toString('hex') + ':' + encrypted.toString('hex');
            
            // 保存到文件
            await fs.writeFile(filePath, encryptedData, 'utf8');
            return true;
        } catch (error) {
            console.error('导出密码失败:', error);
            return false;
        }
    });
    
    // 导入密码
    ipcMain.handle('import-passwords', async (event) => {
        try {
            // 在生产环境下，需要用户确认是否要导入密码
            if (app.isPackaged) {
                const { response } = await dialog.showMessageBox({
                    type: 'warning',
                    buttons: ['取消', '确定'],
                    defaultId: 0,
                    cancelId: 0,
                    title: '确认导入',
                    message: '导入密码可能会覆盖现有数据，确定要继续吗？',
                    detail: '导入的密码将会与现有密码合并，相同ID的密码将会被更新。'
                });
                
                if (response !== 1) {
                    return false;
                }
            }
            
            // 打开文件对话框
            const { filePaths, canceled } = await dialog.showOpenDialog({
                title: '导入密码',
                filters: [
                    { name: 'JSON Files', extensions: ['json'] },
                    { name: 'All Files', extensions: ['*'] }
                ],
                properties: ['openFile']
            });
            
            if (canceled || filePaths.length === 0) {
                return false;
            }
            
            const filePath = filePaths[0];
            
            // 读取并解密文件内容
            const encryptedData = await fs.readFile(filePath, 'utf8');
            const ENCRYPTION_KEY = 'PwdNoteMasterKey';
            const textParts = encryptedData.split(':');
            const iv = Buffer.from(textParts.shift(), 'hex');
            const encryptedText = Buffer.from(textParts.join(':'), 'hex');
            const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY.padEnd(32, '0'), 'utf8'), iv);
            let decrypted = decipher.update(encryptedText);
            decrypted = Buffer.concat([decrypted, decipher.final()]);
            const jsonData = decrypted.toString();
            const importedPasswords = JSON.parse(jsonData);
            
            // 获取现有密码列表
            const existingPasswords = store.get('pwdRecords', []);
            
            // 根据ID去重，保留最新的记录
            const passwordMap = new Map();
            
            // 先添加现有密码
            existingPasswords.forEach(pwd => {
                passwordMap.set(pwd.id, pwd);
            });
            
            // 添加或更新导入的密码
            importedPasswords.forEach(pwd => {
                const existingPwd = passwordMap.get(pwd.id);
                if (!existingPwd || new Date(pwd.createTime) > new Date(existingPwd.createTime)) {
                    passwordMap.set(pwd.id, pwd);
                }
            });
            
            // 保存更新后的密码列表
            const updatedPasswords = Array.from(passwordMap.values());
            store.set('pwdRecords', updatedPasswords);
            
            return true;
        } catch (error) {
            console.error('导入密码失败:', error);
            return false;
        }
    });
}