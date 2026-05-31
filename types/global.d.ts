declare global {
  type PasswordRule = import('./models').PasswordRule;
  type PasswordLength = import('./models').PasswordLength;
  type PasswordRecord = import('./models').PasswordRecord;
  type PasswordStoreData = import('./models').PasswordStoreData;
  type ConfirmMessage = import('./models').ConfirmMessage;
  type TipType = 'success' | 'error' | 'warn';

  interface ElectronAPI {
    sendMessage: (message: string) => void;
    storeGet: <T = unknown>(key: string) => Promise<T | undefined>;
    storeSet: (key: string, value: unknown) => void;
    showStore: () => Promise<PasswordStoreData>;
    showTip: (type: TipType, message: string) => void;
    getUUID: () => string;
    addPwdRecord: (record: PasswordRecord) => Promise<boolean>;
    modifyPwdRecord: (record: PasswordRecord) => Promise<boolean>;
    deletePwdRecord: (record: PasswordRecord) => Promise<boolean>;
    openListWindow: (dataList: PasswordRecord[] | null) => Promise<void>;
    onInit: (cb: (data: unknown) => void) => void;
    openAddPasswordWindow: (data: PasswordRecord | null) => Promise<void>;
    onInitAddPwdItem: (cb: (data: PasswordRecord | null) => void) => void;
    resetStore: () => Promise<boolean>;
    showConfirm: (msg: ConfirmMessage) => Promise<boolean>;
    exportPasswords: (passwords: PasswordRecord[]) => Promise<boolean>;
    importPasswords: () => Promise<boolean>;
    isDevEnvironment: () => Promise<boolean>;
  }

  interface Window {
    electronAPI: ElectronAPI;
  }
}

export {};
