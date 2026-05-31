import { contextBridge, ipcRenderer } from 'electron';
import { randomUUID } from 'node:crypto';
import { Notyf } from 'notyf';

function showNotyf(type: TipType, message: string): void {
  const notyf = new Notyf({
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

const electronAPI: ElectronAPI = {
  sendMessage: (message) => {
    ipcRenderer.send('message', message);
  },
  storeGet: (key) => ipcRenderer.invoke('store-get', key),
  storeSet: (key, value) => {
    ipcRenderer.send('store-set', key, value);
  },
  showStore: () => ipcRenderer.invoke('show-store'),
  showTip: (type, message) => showNotyf(type, message),
  getUUID: () => randomUUID(),
  addPwdRecord: (record) => ipcRenderer.invoke('add-pwd-record', record),
  modifyPwdRecord: (record) => ipcRenderer.invoke('modify-pwd-record', record),
  deletePwdRecord: (record) => ipcRenderer.invoke('delete-pwd-record', record),
  openListWindow: (dataList) => ipcRenderer.invoke('open-list-window', dataList),
  onInit: (cb) => {
    ipcRenderer.on('init-data', (_event, data) => cb(data));
  },
  openAddPasswordWindow: (data) => ipcRenderer.invoke('open-add-password-window', data),
  onInitAddPwdItem: (cb) => {
    ipcRenderer.on('init-data-add-pwd-item', (_event, data) => cb(data));
  },
  resetStore: () => ipcRenderer.invoke('reset-store'),
  showConfirm: (msg) => ipcRenderer.invoke('confirm-delete', msg),
  exportPasswords: (passwords) => ipcRenderer.invoke('export-passwords', passwords),
  importPasswords: () => ipcRenderer.invoke('import-passwords'),
  isDevEnvironment: () => ipcRenderer.invoke('is-dev-environment'),
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);
