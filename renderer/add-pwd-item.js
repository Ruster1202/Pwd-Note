"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const form = mustGetElement('pwdForm');
const submitButton = form.querySelector('.submit-btn');
const toggleBtn = mustGetElement('togglepwd');
const pwdInput = mustGetElement('content');
const accountInput = mustGetElement('account');
const descriptionInput = mustGetElement('description');
const urlInput = mustGetElement('url');
const minLengthInput = mustGetElement('minLength');
const maxLengthInput = mustGetElement('maxLength');
const tagsInput = mustGetElement('tags');
const rulesDiv = mustGetElement('rules');
const lengthDiv = mustGetElement('length');
let modifyUUID = null;
let modeCode = -1;
toggleBtn.addEventListener('click', () => {
    const isPasswordType = pwdInput.type === 'password';
    pwdInput.type = isPasswordType ? 'text' : 'password';
    toggleBtn.textContent = isPasswordType ? '隐藏' : '显示';
});
window.electronAPI.onInitAddPwdItem((data) => {
    rulesDiv.style.display = 'none';
    lengthDiv.style.display = 'none';
    if (data === null) {
        form.setAttribute('novalidate', '');
        modeCode = 1;
        return;
    }
    if (submitButton) {
        submitButton.textContent = '修改';
    }
    modifyUUID = data.id;
    pwdInput.value = data.content;
    form.dataset.createtime = data.createTime;
    accountInput.value = data.account;
    descriptionInput.value = data.description;
    urlInput.value = data.url;
    minLengthInput.value = String(data.length.minLength);
    maxLengthInput.value = String(data.length.maxLength);
    data.rules.forEach((rule) => {
        const checkbox = form.querySelector(`input[value="${rule}"]`);
        if (checkbox) {
            checkbox.checked = true;
        }
    });
    tagsInput.value = data.tags.join(', ');
    if (data.rules[0] === 'custom') {
        form.setAttribute('novalidate', '');
        modeCode = 2;
        return;
    }
    form.removeAttribute('novalidate');
    modeCode = 3;
    rulesDiv.style.display = 'block';
    lengthDiv.style.display = 'block';
});
form.addEventListener('submit', (event) => {
    event.preventDefault();
    void submitPasswordRecord();
});
async function submitPasswordRecord() {
    let checkedRules = [];
    if (modeCode === 3) {
        checkedRules = Array.from(document.querySelectorAll('#rules input[type="checkbox"]:checked')).map((input) => input.value);
        if (checkedRules.length === 0) {
            alert('请至少选择一项规则');
            return;
        }
    }
    const isModify = modeCode === 2 || modeCode === 3;
    const createTime = modeCode === 1 ? new Date().toISOString() : form.dataset.createtime || new Date().toISOString();
    const result = {
        id: modifyUUID ?? window.electronAPI.getUUID(),
        createTime,
        isModify,
        updateTime: isModify ? new Date().toISOString() : null,
        content: pwdInput.value,
        account: accountInput.value,
        description: descriptionInput.value,
        url: urlInput.value,
        rules: modeCode === 3 ? checkedRules : ['custom'],
        length: {
            minLength: modeCode === 3 ? minLengthInput.value || 1 : String(pwdInput.value).length,
            maxLength: modeCode === 3 ? maxLengthInput.value || -1 : -1,
        },
        tags: tagsInput.value
            .split(',')
            .map((tag) => tag.trim())
            .filter((tag) => tag.length > 0),
    };
    if (modifyUUID) {
        await window.electronAPI.modifyPwdRecord(result);
    }
    else {
        await window.electronAPI.addPwdRecord(result);
    }
    window.electronAPI.showTip('success', '密码添加成功！');
    modifyUUID = null;
    setTimeout(() => {
        window.close();
    }, 800);
}
function mustGetElement(id) {
    const element = document.getElementById(id);
    if (!element) {
        throw new Error(`Missing element: ${id}`);
    }
    return element;
}
