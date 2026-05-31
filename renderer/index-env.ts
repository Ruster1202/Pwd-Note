document.addEventListener('DOMContentLoaded', () => {
  void hideToolsInProd();
});

async function hideToolsInProd(): Promise<void> {
  try {
    const isDev = await window.electronAPI.isDevEnvironment();

    if (isDev) {
      return;
    }

    const toolButtons = document.querySelector<HTMLElement>('.tool-buttons');
    if (toolButtons) {
      toolButtons.style.display = 'none';
    }
  } catch (error) {
    console.error('获取环境信息失败:', error);
  }
}
