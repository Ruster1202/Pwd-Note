/* 
该文件定义应用的主窗口并加载预加载脚本
 */
const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
  // 创建浏览器窗口
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js') // 启用预加载脚本
    }
  });

  // 隐藏默认菜单栏（可选）
  Menu.setApplicationMenu(null);

  // 加载本地 HTML 文件
  mainWindow.loadFile('index.html');

  // 开发模式下打开开发者工具（可选）
  mainWindow.webContents.openDevTools();
}

// Electron 初始化完成后创建窗口
app.whenReady().then(createWindow);

// 关闭所有窗口时退出应用（macOS 除外）
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// macOS 点击 Dock 图标重新打开窗口
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});