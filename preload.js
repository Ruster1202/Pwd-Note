// 暴露安全的 API 给渲染进程
const { contextBridge, ipcRenderer } = require('electron');
const { Notyf } = require("notyf");
// 在 Renderer 或 Main 进程中
const { randomUUID } = require('crypto'); // Node.js 方式
// console.log("UUID:" + randomUUID()); // 输出类似 "550e8400-e29b-41d4-a716-446655440000"

contextBridge.exposeInMainWorld('electronAPI', {
  sendMessage: (message) => ipcRenderer.send('message', message),
  storeGet: (key) => ipcRenderer.invoke('store-get', key),
  storeSet: (key, value) => ipcRenderer.send('store-set', key, value),
  showStore: () => ipcRenderer.invoke('show-store'),
  showTip: (type, message) => NotyfShow(type, message),
  getUUID: () => randomUUID(), // Node.js 方式
  addPwdRecord: (record) => ipcRenderer.invoke('add-pwd-record', record),
  modifyPwdRecord: (record) => ipcRenderer.invoke('modify-pwd-record', record),
  deletePwdRecord: (record) => ipcRenderer.invoke('delete-pwd-record', record),
  // loadPasswordList: () => ipcRenderer.send('load-password-list'),
  openListWindow: (dataList) => ipcRenderer.invoke('open-list-window',dataList),
  onInit: (cb) => ipcRenderer.on('init-data', (event, data) => cb(data)),
  openAddPasswordWindow: (data) => ipcRenderer.invoke('open-add-password-window',data),
  onInitAddPwdItem: (cb) => ipcRenderer.on('init-data-add-pwd-item', (event, data) => cb(data)),
  resetStore: () => ipcRenderer.invoke('reset-store'),
  // 确认框
  showConfirm: (msg) => ipcRenderer.invoke('confirm-delete', msg),
  // 导出密码
  exportPasswords: (passwords) => ipcRenderer.invoke('export-passwords', passwords),
  // 导入密码
  importPasswords: () => ipcRenderer.invoke('import-passwords'),
});

let notyf = null;
function NotyfShow(type,message) {
  notyf = new Notyf({
    duration: 1500, //显示时长(ms)
    position: { x: "center", y: "top" }, // 参见https://carlosroso.com/notyf/
    // dismissible: true ,// 显示关闭按钮
    // backgroundColor: '#FF5733', // 背景颜色
    // icon: 'check-circle'
    ripple: true, // 启用涟漪
    // 最后还可以使用 types自定义
  });
  if (type === "success") {
    notyf.success(message);
  } else if (type === "error") {
    notyf.error(message);
  } else if (type === "warn") {
    notyf.error(message);
  } else {
    notyf.error("未知消息类型！");
  }
  notyf = null;
}