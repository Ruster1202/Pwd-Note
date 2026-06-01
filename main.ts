/*
该文件定义应用的主窗口并加载预加载脚本
*/
import { app, BrowserWindow, dialog, ipcMain, screen } from 'electron';
import crypto from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import Store from 'electron-store';

type PasswordLength = {
  minLength: number | string;
  maxLength: number | string;
};

interface PasswordRecord {
  id: string;
  createTime: string;
  isModify: boolean;
  updateTime?: string | null;
  content: string;
  account: string;
  description: string;
  url: string;
  rules: string[];
  length: PasswordLength;
  tags: string[];
  userName?: string;
}

interface StoreSchema {
  pwdRecords?: PasswordRecord[];
  [key: string]: unknown;
}

interface ConfirmMessage {
  title?: string;
  message?: string;
  detail?: string;
}

const store = new Store<StoreSchema>();
let mainWindow: BrowserWindow | null = null;
let currentDataList: PasswordRecord[] = [];

function getPwdRecords(): PasswordRecord[] {
  return store.get('pwdRecords', [] as PasswordRecord[]);
}

function detectPasswordRules(content: string): string[] {
  const rules: string[] = [];

  if (/[A-Z]/.test(content)) {
    rules.push('uppercaseChars');
  }
  if (/[a-z]/.test(content)) {
    rules.push('lowercaseChars');
  }
  if (/\d/.test(content)) {
    rules.push('numberChars');
  }
  if (/[^A-Za-z0-9]/.test(content)) {
    rules.push('symbolChars');
  }

  return rules.length > 0 ? rules : ['custom'];
}

function withNormalizedRules(record: PasswordRecord): PasswordRecord {
  return {
    ...record,
    rules: detectPasswordRules(record.content),
  };
}

function createWindow(): void {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  mainWindow = new BrowserWindow({
    width: Math.min(600, width),
    height: Math.min(600, height),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
    },
  });

  mainWindow.loadFile('index.html');
  registerIPC();
}

function createListWindow(data: PasswordRecord[] | null): void {
  console.log('data:', data);

  const listWin = new BrowserWindow({
    width: 600,
    height: 800,
    parent: BrowserWindow.getFocusedWindow() ?? undefined,
    modal: true,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
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

function createAddPasswordWindow(data: PasswordRecord | null): void {
  console.log('data:', data);

  const addPwdWin = new BrowserWindow({
    width: 600,
    height: 800,
    parent: BrowserWindow.getFocusedWindow() ?? undefined,
    modal: true,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
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

function registerIPC(): void {
  const isDev = !app.isPackaged;

  ipcMain.handle('is-dev-environment', () => isDev);

  ipcMain.handle('store-get', (_event, key: string) => {
    console.log('[store-get]：', key);
    return store.get(key);
  });

  ipcMain.on('store-set', (_event, key: string, value: unknown) => {
    console.log('[store-set]：', key, value);
    store.set(key, value);
  });

  ipcMain.handle('show-store', () => {
    console.log('[show-store]：', store.store);
    return store.store;
  });

  ipcMain.handle('add-pwd-record', (_event, record: PasswordRecord) => {
    const list = getPwdRecords();
    const existed = list.some((item) => item.id === record.id);

    if (existed) {
      return false;
    }

    list.push(record);
    store.set('pwdRecords', list);
    return true;
  });

  ipcMain.handle('modify-pwd-record', (_event, record: PasswordRecord) => {
    const list = getPwdRecords();
    const index = list.findIndex((item) => item.id === record.id);

    if (index === -1) {
      return false;
    }

    list[index] = withNormalizedRules(record);
    store.set('pwdRecords', list);
    return true;
  });

  ipcMain.handle('delete-pwd-record', (_event, record: PasswordRecord) => {
    const list = getPwdRecords();
    const newList = list.filter((item) => item.id !== record.id);
    store.set('pwdRecords', newList);
    return true;
  });

  ipcMain.handle('open-list-window', (_event, data: PasswordRecord[] | null) => {
    currentDataList = Array.isArray(data) ? data : [];
    createListWindow(data ?? null);
  });

  ipcMain.handle('open-add-password-window', (_event, data: PasswordRecord | null) => {
    createAddPasswordWindow(data ?? null);
  });

  ipcMain.handle('get-current-dataList', () => currentDataList);

  ipcMain.handle('reset-store', () => {
    try {
      store.clear();
      return true;
    } catch (error) {
      console.error('Error clearing store:', error);
      return false;
    }
  });

  ipcMain.handle('confirm-delete', async (_event, msg: ConfirmMessage) => {
    const { response } = await dialog.showMessageBox({
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

  ipcMain.handle('export-passwords', async (_event, passwords: PasswordRecord[]) => {
    try {
      const { filePath, canceled } = await dialog.showSaveDialog({
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
      const iv = crypto.randomBytes(ivLength);
      const cipher = crypto.createCipheriv(
        'aes-256-cbc',
        Buffer.from(encryptionKey.padEnd(32, '0'), 'utf8'),
        iv,
      );

      const jsonData = JSON.stringify(passwords, null, 2);
      let encrypted = cipher.update(jsonData);
      encrypted = Buffer.concat([encrypted, cipher.final()]);
      const encryptedData = `${iv.toString('hex')}:${encrypted.toString('hex')}`;

      await fs.writeFile(filePath, encryptedData, 'utf8');
      return true;
    } catch (error) {
      console.error('导出密码失败:', error);
      return false;
    }
  });

  ipcMain.handle('import-passwords', async () => {
    try {
      if (app.isPackaged) {
        const { response } = await dialog.showMessageBox({
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

      const { filePaths, canceled } = await dialog.showOpenDialog({
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

      const encryptedData = await fs.readFile(filePaths[0], 'utf8');
      const encryptionKey = 'PwdNoteMasterKey';
      const textParts = encryptedData.split(':');
      const ivHex = textParts.shift();

      if (!ivHex) {
        return false;
      }

      const iv = Buffer.from(ivHex, 'hex');
      const encryptedText = Buffer.from(textParts.join(':'), 'hex');
      const decipher = crypto.createDecipheriv(
        'aes-256-cbc',
        Buffer.from(encryptionKey.padEnd(32, '0'), 'utf8'),
        iv,
      );

      let decrypted = decipher.update(encryptedText);
      decrypted = Buffer.concat([decrypted, decipher.final()]);
      const jsonData = decrypted.toString();
      const importedPasswords = JSON.parse(jsonData) as PasswordRecord[];

      if (!Array.isArray(importedPasswords)) {
        return false;
      }

      const existingPasswords = getPwdRecords();
      const passwordMap = new Map<string, PasswordRecord>();

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
    } catch (error) {
      console.error('导入密码失败:', error);
      return false;
    }
  });
}

app.whenReady().then(createWindow);
