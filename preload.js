"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const node_crypto_1 = require("node:crypto");
const notyf_1 = require("notyf");
function showNotyf(type, message) {
    const notyf = new notyf_1.Notyf({
        duration: 1500,
        position: { x: 'center', y: 'top' },
        ripple: true,
    });
    if (type === 'success') {
        notyf.success(message);
        return;
    }
    if (type === 'error' || type === 'warn') {
        notyf.error(message);
        return;
    }
    notyf.error('未知消息类型！');
}
const electronAPI = {
    sendMessage: (message) => {
        electron_1.ipcRenderer.send('message', message);
    },
    storeGet: (key) => electron_1.ipcRenderer.invoke('store-get', key),
    storeSet: (key, value) => {
        electron_1.ipcRenderer.send('store-set', key, value);
    },
    showStore: () => electron_1.ipcRenderer.invoke('show-store'),
    showTip: (type, message) => showNotyf(type, message),
    getUUID: () => (0, node_crypto_1.randomUUID)(),
    addPwdRecord: (record) => electron_1.ipcRenderer.invoke('add-pwd-record', record),
    modifyPwdRecord: (record) => electron_1.ipcRenderer.invoke('modify-pwd-record', record),
    deletePwdRecord: (record) => electron_1.ipcRenderer.invoke('delete-pwd-record', record),
    openListWindow: (dataList) => electron_1.ipcRenderer.invoke('open-list-window', dataList),
    onInit: (cb) => {
        electron_1.ipcRenderer.on('init-data', (_event, data) => cb(data));
    },
    openAddPasswordWindow: (data) => electron_1.ipcRenderer.invoke('open-add-password-window', data),
    onInitAddPwdItem: (cb) => {
        electron_1.ipcRenderer.on('init-data-add-pwd-item', (_event, data) => cb(data));
    },
    resetStore: () => electron_1.ipcRenderer.invoke('reset-store'),
    showConfirm: (msg) => electron_1.ipcRenderer.invoke('confirm-delete', msg),
    exportPasswords: (passwords) => electron_1.ipcRenderer.invoke('export-passwords', passwords),
    importPasswords: () => electron_1.ipcRenderer.invoke('import-passwords'),
    isDevEnvironment: () => electron_1.ipcRenderer.invoke('is-dev-environment'),
};
electron_1.contextBridge.exposeInMainWorld('electronAPI', electronAPI);
