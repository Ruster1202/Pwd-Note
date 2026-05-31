"use strict";
// TODO:自定义使用布局
// TODO:控制宽度为固定几个模板
// TODO:提供一个历史密码生成列表，避免点击太快看不到曾经生成过的密码
// TODO:记得添加导出功能
const lowercaseChars = 'abcdefghijklmnopqrstuvwxyz';
const uppercaseChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const numberChars = '0123456789';
const symbolChars = '!@#$%^&*()_+-=[]{}|;:,.<>?~';
const roleList = [
    {
        data: uppercaseChars,
        name: 'uppercaseChars',
    },
    {
        data: lowercaseChars,
        name: 'lowercaseChars',
    },
    {
        data: numberChars,
        name: 'numberChars',
    },
    {
        data: symbolChars,
        name: 'symbolChars',
    },
];
const globalCurrentPwd = {
    id: '',
    createTime: '',
    isModify: false,
    modifyTime: null,
    content: '',
    account: '',
    description: '',
    url: '',
    rules: [],
    length: {
        minLength: 0,
        maxLength: 0,
    },
    tags: [],
    userName: 'default',
};
document.addEventListener('DOMContentLoaded', async () => {
    await init();
    getDomElement('generate').addEventListener('click', () => {
        void generatePassword();
    });
    getDomElement('save').addEventListener('click', () => {
        void savePassword();
    });
    getDomElement('viewPasswords').addEventListener('click', () => {
        void viewPasswords();
    });
    getDomElement('reset-store').addEventListener('click', () => {
        void loadResetTool();
    });
    getDomElement('check-store').addEventListener('click', () => {
        void loadCheckTool();
    });
    getDomElement('generate-store').addEventListener('click', () => {
        void loadGenerateTool();
    });
    const els = document.querySelectorAll('#uppercase, #lowercase, #numbers, #symbols, #minLength, #maxLength');
    els.forEach((el) => el.addEventListener('change', handleConditionChange));
});
async function init() {
    console.log('init');
}
function initGlobalCurrentPwd() {
    globalCurrentPwd.id = '';
    globalCurrentPwd.createTime = '';
    globalCurrentPwd.isModify = false;
    globalCurrentPwd.modifyTime = null;
    globalCurrentPwd.content = '';
    globalCurrentPwd.account = '';
    globalCurrentPwd.description = '';
    globalCurrentPwd.url = '';
    globalCurrentPwd.rules = [];
    globalCurrentPwd.length.minLength = 0;
    globalCurrentPwd.length.maxLength = 0;
    globalCurrentPwd.tags = [];
    globalCurrentPwd.userName = 'default';
}
async function savePassword() {
    const dom = getDom();
    const password = dom.passwordField.value;
    if (!password) {
        window.electronAPI.showTip('error', '请先生成密码');
        return;
    }
    const saved = await window.electronAPI.addPwdRecord(globalCurrentPwd);
    if (saved) {
        window.electronAPI.showTip('success', '密码已保存到密码本！');
        return;
    }
    window.electronAPI.showTip('error', '密码已存在，请勿重复添加！');
}
async function viewPasswords() {
    const store = await window.electronAPI.showStore();
    window.electronAPI.openListWindow(store.pwdRecords ?? []);
}
async function generatePassword() {
    initGlobalCurrentPwd();
    const dom = getDom();
    const minLength = Number.parseInt(dom.minLengthInput.value, 10);
    const maxLength = Number.parseInt(dom.maxLengthInput.value, 10);
    if (minLength > maxLength) {
        alert('最小长度不能大于最大长度');
        return false;
    }
    if (minLength < 4 || maxLength > 128) {
        alert('密码长度范围应在4-128之间');
        return false;
    }
    const targetLength = Math.floor(Math.random() * (maxLength - minLength + 1)) + minLength;
    let password = '';
    let charSet = '';
    const rules = [];
    const checkboxList = [
        dom.uppercaseCheckbox,
        dom.lowercaseCheckbox,
        dom.numbersCheckbox,
        dom.symbolsCheckbox,
    ];
    for (let i = 0; i < checkboxList.length; i += 1) {
        if (!checkboxList[i].checked) {
            continue;
        }
        const role = roleList[i];
        charSet += role.data;
        rules.push(role.name);
        const randomIndex = Math.floor(Math.random() * role.data.length);
        password += role.data[randomIndex];
    }
    if (charSet.length === 0) {
        alert('请至少选择一种字符类型');
        return false;
    }
    const remainLength = targetLength - password.length;
    for (let i = 0; i < remainLength; i += 1) {
        const randomIndex = Math.floor(Math.random() * charSet.length);
        password += charSet[randomIndex];
    }
    password = password
        .split('')
        .sort(() => Math.random() - 0.5)
        .join('');
    globalCurrentPwd.id = window.electronAPI.getUUID();
    globalCurrentPwd.createTime = new Date().toLocaleString();
    globalCurrentPwd.content = password;
    globalCurrentPwd.rules = rules;
    globalCurrentPwd.length.minLength = minLength;
    globalCurrentPwd.length.maxLength = maxLength;
    dom.passwordField.value = password;
    return true;
}
async function loadResetTool() {
    const ok = await window.electronAPI.resetStore();
    window.electronAPI.showTip(ok ? 'success' : 'error', ok ? '存储已重置！' : '存储重置失败！');
}
async function loadCheckTool() {
    const store = await window.electronAPI.showStore();
    console.log('check-store:', store);
    window.electronAPI.showTip('success', '存储已打印到控制台！');
}
async function loadGenerateTool() {
    for (let i = 0; i < 10; i += 1) {
        const generated = await generatePassword();
        if (!generated) {
            window.electronAPI.showTip('error', '生成失败,请查看提示！');
            return;
        }
        await savePassword();
    }
    window.electronAPI.showTip('success', '批量密码已生成并保存到密码本！');
}
function getDom() {
    return {
        minLengthInput: getDomElement('minLength'),
        maxLengthInput: getDomElement('maxLength'),
        lowercaseCheckbox: getDomElement('lowercase'),
        uppercaseCheckbox: getDomElement('uppercase'),
        numbersCheckbox: getDomElement('numbers'),
        symbolsCheckbox: getDomElement('symbols'),
        passwordField: getDomElement('password'),
    };
}
function handleConditionChange() {
    const dom = getDom();
    dom.passwordField.value = '';
}
function getDomElement(id) {
    const element = document.getElementById(id);
    if (!element) {
        throw new Error(`Missing element: ${id}`);
    }
    return element;
}
