// 暴露安全的 API 给渲染进程
const { contextBridge, ipcRenderer } = require('electron');
const { Notyf } = require("notyf");

contextBridge.exposeInMainWorld('electronAPI', {
  sendMessage: (message) => ipcRenderer.send('message', message),
  storeGet: (key) => ipcRenderer.invoke('store-get', key),
  storeSet: (key, value) => ipcRenderer.send('store-set', key, value),
  showStore: () => ipcRenderer.invoke('show-store'),
  showTip: (type, message) => NotyfShow(type, message)
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