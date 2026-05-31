const ruleLabels: Record<PasswordRule, string> = {
  uppercaseChars: '大写',
  lowercaseChars: '小写',
  numberChars: '数字',
  symbolChars: '符号',
  custom: '自定义',
};

const container = getPwdListElement<HTMLDivElement>('list');
const fabAdd = getPwdListElement<HTMLDivElement>('fabAdd');
const fabExport = getPwdListElement<HTMLDivElement>('fabExport');
const fabImport = getPwdListElement<HTMLDivElement>('fabImport');

fabAdd.addEventListener('click', () => {
  void window.electronAPI.openAddPasswordWindow(null);
});

fabExport.addEventListener('click', () => {
  void handleExportPasswords();
});

fabImport.addEventListener('click', () => {
  void handleImportPasswords();
});

void loadPasswordList();

async function handleExportPasswords(): Promise<void> {
  try {
    const store = await window.electronAPI.showStore();
    const passwordRecords = store.pwdRecords ?? [];

    if (passwordRecords.length === 0) {
      window.electronAPI.showTip('error', '没有可导出的密码记录');
      return;
    }

    const exported = await window.electronAPI.exportPasswords(passwordRecords);
    if (exported) {
      window.electronAPI.showTip('success', '密码导出成功');
    }
  } catch (error) {
    console.error('导出密码失败:', error);
    window.electronAPI.showTip('error', '导出密码失败');
  }
}

async function handleImportPasswords(): Promise<void> {
  try {
    const imported = await window.electronAPI.importPasswords();
    if (imported) {
      window.electronAPI.showTip('success', '密码导入成功');
      location.reload();
    }
  } catch (error) {
    console.error('导入密码失败:', error);
    window.electronAPI.showTip('error', '导入密码失败');
  }
}

async function loadPasswordList(): Promise<void> {
  container.innerHTML = '';

  const store = await window.electronAPI.showStore();
  const list = store.pwdRecords ?? [];

  if (list.length === 0) {
    const placeholder = document.createElement('div');
    placeholder.className = 'empty-state';
    placeholder.innerText = '暂未保存密码记录';
    container.appendChild(placeholder);
    return;
  }

  list.forEach((item) => {
    container.appendChild(createPasswordCard(item));
  });
}

function createPasswordCard(item: PasswordRecord): HTMLDivElement {
  const content = escapeHtml(item.content);
  const createTime = escapeHtml(item.createTime);
  const rules = escapeHtml(item.rules.map((ruleKey) => ruleLabels[ruleKey]).join(', '));
  const lengthMin = escapeHtml(String(item.length.minLength));
  const lengthMax = escapeHtml(String(item.length.maxLength));
  const url = escapeHtml(item.url || '');

  const card = document.createElement('div');
  card.className = 'card';
  card.innerHTML = `
    <div class="card-header">
      <div class="title-and-btns">
        <button class="btn-inline btn-copy">复制</button>
        <button class="btn-inline btn-show">显示</button>
        <span class="card-title">******</span>
      </div>
      <div class="card-time">${createTime}</div>
    </div>
    <div class="field field-url">
      <span class="label">网址:</span>
      <a href="${url}" target="_blank">${url}</a>
    </div>
    <div class="card-body">
      <div><span class="label">Rules:</span> <span class="value">${rules}</span></div>
      <div><span class="label">Length:</span> <span class="value">${lengthMin} – ${lengthMax}</span></div>
    </div>
    <button class="btn-edit" title="编辑">✎</button>
    <button class="btn-delete" title="删除">🗑</button>
  `;

  const titleSpan = mustQueryElement<HTMLSpanElement>(card, '.card-title');
  const showBtn = mustQueryElement<HTMLButtonElement>(card, '.btn-show');
  const copyBtn = mustQueryElement<HTMLButtonElement>(card, '.btn-copy');
  const editBtn = mustQueryElement<HTMLButtonElement>(card, '.btn-edit');
  const deleteBtn = mustQueryElement<HTMLButtonElement>(card, '.btn-delete');

  let hidden = true;

  showBtn.addEventListener('click', () => {
    hidden = !hidden;
    titleSpan.innerText = hidden ? '******' : content;
    showBtn.innerText = hidden ? '显示' : '隐藏';
  });

  copyBtn.addEventListener('click', () => {
    void copyToClipboard(content, copyBtn);
  });

  card.addEventListener('dblclick', () => {
    void copyToClipboard(content);
  });

  editBtn.addEventListener('click', (event) => {
    event.stopPropagation();
    void window.electronAPI.openAddPasswordWindow(item);
  });

  deleteBtn.addEventListener('click', (event) => {
    event.stopPropagation();
    void deletePasswordCard(item, card);
  });

  card.title = '双击以复制';
  return card;
}

async function copyToClipboard(content: string, copyBtn?: HTMLButtonElement): Promise<void> {
  await navigator.clipboard.writeText(content);

  if (copyBtn) {
    copyBtn.innerText = '已复制';
  }

  window.electronAPI.showTip('success', '已复制！');

  if (!copyBtn) {
    return;
  }

  setTimeout(() => {
    copyBtn.innerText = '复制';
  }, 1000);
}

async function deletePasswordCard(item: PasswordRecord, card: HTMLDivElement): Promise<void> {
  const confirmed = await window.electronAPI.showConfirm({
    title: '确认删除记录',
    message: '你确定要删除该记录吗？',
    detail: '此操作不可撤销！！！',
  });

  if (!confirmed) {
    window.electronAPI.showTip('error', '删除失败，用户取消操作！');
    return;
  }

  await window.electronAPI.deletePwdRecord(item);
  window.electronAPI.showTip('success', '删除成功！');

  if (container.contains(card)) {
    container.removeChild(card);
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    .replace(/`/g, '&#096;');
}

function getPwdListElement<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);

  if (!element) {
    throw new Error(`Missing element: ${id}`);
  }

  return element as T;
}

function mustQueryElement<T extends Element>(root: ParentNode, selector: string): T {
  const element = root.querySelector(selector);

  if (!element) {
    throw new Error(`Missing element: ${selector}`);
  }

  return element as T;
}
