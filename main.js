"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/*
该文件定义应用的主窗口并加载预加载脚本
*/
const electron_1 = require("electron");
const node_crypto_1 = __importDefault(require("node:crypto"));
const node_fs_1 = require("node:fs");
const node_path_1 = __importDefault(require("node:path"));
const electron_store_1 = __importDefault(require("electron-store"));
const store = new electron_store_1.default();
let mainWindow = null;
let currentDataList = [];
function getPwdRecords() {
    return store.get('pwdRecords', []);
}
function createWindow() {
    const { width, height } = electron_1.screen.getPrimaryDisplay().workAreaSize;
    mainWindow = new electron_1.BrowserWindow({
        width: Math.min(600, width),
        height: Math.min(600, height),
        webPreferences: {
            preload: node_path_1.default.join(__dirname, 'preload.js'),
            nodeIntegration: true,
        },
    });
    mainWindow.loadFile('index.html');
    registerIPC();
}
function createListWindow(data) {
    console.log('data:', data);
    const listWin = new electron_1.BrowserWindow({
        width: 600,
        height: 800,
        parent: electron_1.BrowserWindow.getFocusedWindow() ?? undefined,
        modal: true,
        show: false,
        webPreferences: {
            preload: node_path_1.default.join(__dirname, 'preload.js'),
            nodeIntegration: true,
            sandbox: false,
        },
    });
    listWin.loadFile('pwd-list.html');
    listWin.once('ready-to-show', () => {
        console.log('ready-to-show...');
        listWin.show();
    });
    listWin.webContents.on('did-finish-load', () => {
        console.log('did-finish-load...');
    });
}
function createAddPasswordWindow(data) {
    console.log('data:', data);
    const addPwdWin = new electron_1.BrowserWindow({
        width: 600,
        height: 800,
        parent: electron_1.BrowserWindow.getFocusedWindow() ?? undefined,
        modal: true,
        show: false,
        webPreferences: {
            preload: node_path_1.default.join(__dirname, 'preload.js'),
            nodeIntegration: true,
            sandbox: false,
        },
    });
    addPwdWin.loadFile('add-pwd-item.html');
    addPwdWin.once('ready-to-show', () => {
        addPwdWin.show();
        addPwdWin.webContents.send('init-data-add-pwd-item', data);
    });
}
function registerIPC() {
    const isDev = !electron_1.app.isPackaged;
    electron_1.ipcMain.handle('is-dev-environment', () => isDev);
    electron_1.ipcMain.handle('store-get', (_event, key) => {
        console.log('[store-get]：', key);
        return store.get(key);
    });
    electron_1.ipcMain.on('store-set', (_event, key, value) => {
        console.log('[store-set]：', key, value);
        store.set(key, value);
    });
    electron_1.ipcMain.handle('show-store', () => {
        console.log('[show-store]：', store.store);
        return store.store;
    });
    electron_1.ipcMain.handle('add-pwd-record', (_event, record) => {
        const list = getPwdRecords();
        const existed = list.some((item) => item.id === record.id);
        if (existed) {
            return false;
        }
        list.push(record);
        store.set('pwdRecords', list);
        return true;
    });
    electron_1.ipcMain.handle('modify-pwd-record', (_event, record) => {
        const list = getPwdRecords();
        const index = list.findIndex((item) => item.id === record.id);
        if (index === -1) {
            return false;
        }
        list[index] = record;
        store.set('pwdRecords', list);
        return true;
    });
    electron_1.ipcMain.handle('delete-pwd-record', (_event, record) => {
        const list = getPwdRecords();
        const newList = list.filter((item) => item.id !== record.id);
        store.set('pwdRecords', newList);
        return true;
    });
    electron_1.ipcMain.handle('open-list-window', (_event, data) => {
        currentDataList = Array.isArray(data) ? data : [];
        createListWindow(data ?? null);
    });
    electron_1.ipcMain.handle('open-add-password-window', (_event, data) => {
        createAddPasswordWindow(data ?? null);
    });
    electron_1.ipcMain.handle('get-current-dataList', () => currentDataList);
    electron_1.ipcMain.handle('reset-store', () => {
        try {
            store.clear();
            return true;
        }
        catch (error) {
            console.error('Error clearing store:', error);
            return false;
        }
    });
    electron_1.ipcMain.handle('confirm-delete', async (_event, msg) => {
        const { response } = await electron_1.dialog.showMessageBox({
            type: 'question',
            buttons: ['取消', '确定'],
            defaultId: 1,
            cancelId: 0,
            title: msg.title ?? '确认操作',
            message: msg.message ?? '你确定要继续执行此操作吗？',
            detail: msg.detail ?? '此操作不可撤销。',
        });
        return response === 1;
    });
    electron_1.ipcMain.handle('export-passwords', async (_event, passwords) => {
        try {
            const { filePath, canceled } = await electron_1.dialog.showSaveDialog({
                title: '导出密码',
                defaultPath: `pwd_export_${new Date().toISOString().slice(0, 10)}.json`,
                filters: [
                    { name: 'JSON Files', extensions: ['json'] },
                    { name: 'All Files', extensions: ['*'] },
                ],
            });
            if (canceled || !filePath) {
                return false;
            }
            const encryptionKey = 'PwdNoteMasterKey';
            const ivLength = 16;
            const iv = node_crypto_1.default.randomBytes(ivLength);
            const cipher = node_crypto_1.default.createCipheriv('aes-256-cbc', Buffer.from(encryptionKey.padEnd(32, '0'), 'utf8'), iv);
            const jsonData = JSON.stringify(passwords, null, 2);
            let encrypted = cipher.update(jsonData);
            encrypted = Buffer.concat([encrypted, cipher.final()]);
            const encryptedData = `${iv.toString('hex')}:${encrypted.toString('hex')}`;
            await node_fs_1.promises.writeFile(filePath, encryptedData, 'utf8');
            return true;
        }
        catch (error) {
            console.error('导出密码失败:', error);
            return false;
        }
    });
    electron_1.ipcMain.handle('import-passwords', async () => {
        try {
            if (electron_1.app.isPackaged) {
                const { response } = await electron_1.dialog.showMessageBox({
                    type: 'warning',
                    buttons: ['取消', '确定'],
                    defaultId: 0,
                    cancelId: 0,
                    title: '确认导入',
                    message: '导入密码可能会覆盖现有数据，确定要继续吗？',
                    detail: '导入的密码将会与现有密码合并，相同ID的密码将会被更新。',
                });
                if (response !== 1) {
                    return false;
                }
            }
            const { filePaths, canceled } = await electron_1.dialog.showOpenDialog({
                title: '导入密码',
                filters: [
                    { name: 'JSON Files', extensions: ['json'] },
                    { name: 'All Files', extensions: ['*'] },
                ],
                properties: ['openFile'],
            });
            if (canceled || filePaths.length === 0) {
                return false;
            }
            const encryptedData = await node_fs_1.promises.readFile(filePaths[0], 'utf8');
            const encryptionKey = 'PwdNoteMasterKey';
            const textParts = encryptedData.split(':');
            const ivHex = textParts.shift();
            if (!ivHex) {
                return false;
            }
            const iv = Buffer.from(ivHex, 'hex');
            const encryptedText = Buffer.from(textParts.join(':'), 'hex');
            const decipher = node_crypto_1.default.createDecipheriv('aes-256-cbc', Buffer.from(encryptionKey.padEnd(32, '0'), 'utf8'), iv);
            let decrypted = decipher.update(encryptedText);
            decrypted = Buffer.concat([decrypted, decipher.final()]);
            const jsonData = decrypted.toString();
            const importedPasswords = JSON.parse(jsonData);
            if (!Array.isArray(importedPasswords)) {
                return false;
            }
            const existingPasswords = getPwdRecords();
            const passwordMap = new Map();
            existingPasswords.forEach((pwd) => {
                passwordMap.set(pwd.id, pwd);
            });
            importedPasswords.forEach((pwd) => {
                const existingPwd = passwordMap.get(pwd.id);
                if (!existingPwd || new Date(pwd.createTime) > new Date(existingPwd.createTime)) {
                    passwordMap.set(pwd.id, pwd);
                }
            });
            const updatedPasswords = Array.from(passwordMap.values());
            store.set('pwdRecords', updatedPasswords);
            return true;
        }
        catch (error) {
            console.error('导入密码失败:', error);
            return false;
        }
    });
}
electron_1.app.whenReady().then(createWindow);
