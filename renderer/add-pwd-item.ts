const form = getAddPwdElement<HTMLFormElement>('pwdForm');
const submitButton = form.querySelector<HTMLButtonElement>('.submit-btn');
const toggleBtn = getAddPwdElement<HTMLButtonElement>('togglepwd');
const pwdInput = getAddPwdElement<HTMLInputElement>('content');
const accountInput = getAddPwdElement<HTMLInputElement>('account');
const descriptionInput = getAddPwdElement<HTMLTextAreaElement>('description');
const urlInput = getAddPwdElement<HTMLInputElement>('url');
const minLengthInput = getAddPwdElement<HTMLInputElement>('minLength');
const maxLengthInput = getAddPwdElement<HTMLInputElement>('maxLength');
const tagsInput = getAddPwdElement<HTMLInputElement>('tags');
const rulesDiv = getAddPwdElement<HTMLDivElement>('rules');
const lengthDiv = getAddPwdElement<HTMLDivElement>('length');

let modifyUUID: string | null = null;
let modeCode: -1 | 1 | 2 | 3 = -1;

toggleBtn.addEventListener('click', () => {
  const isPasswordType = pwdInput.type === 'password';
  pwdInput.type = isPasswordType ? 'text' : 'password';
  toggleBtn.textContent = isPasswordType ? '隐藏' : '显示';
});

pwdInput.addEventListener('input', () => {
  if (modeCode === 3) {
    syncRuleCheckboxesByPassword(pwdInput.value);
  }
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
    const checkbox = form.querySelector<HTMLInputElement>(`input[value="${rule}"]`);
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
  syncRuleCheckboxesByPassword(pwdInput.value);
});

form.addEventListener('submit', (event) => {
  event.preventDefault();
  void submitPasswordRecord();
});

async function submitPasswordRecord(): Promise<void> {
  const isModify = modeCode === 2 || modeCode === 3;
  const createTime = modeCode === 1 ? new Date().toISOString() : form.dataset.createtime || new Date().toISOString();
  const autoRules = detectPasswordRules(pwdInput.value);
  const finalRules: PasswordRule[] = isModify ? autoRules : ['custom'];

  const result: PasswordRecord = {
    id: modifyUUID ?? window.electronAPI.getUUID(),
    createTime,
    isModify,
    updateTime: isModify ? new Date().toISOString() : null,
    content: pwdInput.value,
    account: accountInput.value,
    description: descriptionInput.value,
    url: urlInput.value,
    rules: finalRules,
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
  } else {
    await window.electronAPI.addPwdRecord(result);
  }

  window.electronAPI.showTip('success', '密码添加成功！');

  modifyUUID = null;

  setTimeout(() => {
    window.close();
  }, 800);
}

function getAddPwdElement<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);

  if (!element) {
    throw new Error(`Missing element: ${id}`);
  }

  return element as T;
}

function detectPasswordRules(password: string): PasswordRule[] {
  const detectedRules: PasswordRule[] = [];

  if (/[A-Z]/.test(password)) {
    detectedRules.push('uppercaseChars');
  }
  if (/[a-z]/.test(password)) {
    detectedRules.push('lowercaseChars');
  }
  if (/\d/.test(password)) {
    detectedRules.push('numberChars');
  }
  if (/[^A-Za-z0-9]/.test(password)) {
    detectedRules.push('symbolChars');
  }

  if (detectedRules.length === 0) {
    detectedRules.push('custom');
  }

  return detectedRules;
}

function syncRuleCheckboxesByPassword(password: string): void {
  const detected = new Set(detectPasswordRules(password));
  const checkboxes = form.querySelectorAll<HTMLInputElement>('#rules input[type="checkbox"]');

  checkboxes.forEach((checkbox) => {
    checkbox.checked = detected.has(checkbox.value as PasswordRule);
  });
}
