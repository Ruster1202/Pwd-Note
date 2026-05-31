export type PasswordRule = 'uppercaseChars' | 'lowercaseChars' | 'numberChars' | 'symbolChars' | 'custom';

export interface PasswordLength {
  minLength: number | string;
  maxLength: number | string;
}

export interface PasswordRecord {
  id: string;
  createTime: string;
  isModify: boolean;
  updateTime?: string | null;
  content: string;
  account: string;
  description: string;
  url: string;
  rules: PasswordRule[];
  length: PasswordLength;
  tags: string[];
  userName?: string;
}

export interface PasswordStoreData {
  pwdRecords?: PasswordRecord[];
  [key: string]: unknown;
}

export interface ConfirmMessage {
  title?: string;
  message?: string;
  detail?: string;
}
