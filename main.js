/* 
该文件定义应用的主窗口并加载预加载脚本
 */
const { app, BrowserWindow, Menu ,screen, ipcMain } = require('electron');
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
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'), // 启用预加载脚本
            // contextIsolation: true,
            // enableRemoteModule: false,
            // nodeIntegration: true,
        }
    });

    // 隐藏默认菜单栏（可选）
    Menu.setApplicationMenu(null);

    // 加载本地 HTML 文件
    mainWindow.loadFile('index.html');
    // IPC 注册
    IPCRegister(mainWindow);
    // 开发模式下打开开发者工具（可选）
    mainWindow.webContents.openDevTools();
    

}

// Electron 初始化完成后创建窗口
app.whenReady().then(createWindow);

function IPCRegister(win) {
    ipcMain.handle('store-get', (event, key) => {
        console.log('[store-get]：', key);
        return store.get(key); // 获取存储的值
    });
    ipcMain.on('store-set', (event, key, value) => {
        console.log('[store-set]：', key, value);
        store.set(key, value); // 设置存储的值
    });
    ipcMain.handle('show-store', (event) => {
        console.log('[show-store]：',store.store);
        return store.store; // 获取存储的值
    });
    
}