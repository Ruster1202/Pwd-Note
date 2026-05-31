"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
document.addEventListener('DOMContentLoaded', () => {
    void hideToolsInProd();
});
async function hideToolsInProd() {
    try {
        const isDev = await window.electronAPI.isDevEnvironment();
        if (isDev) {
            return;
        }
        const toolButtons = document.querySelector('.tool-buttons');
        if (toolButtons) {
            toolButtons.style.display = 'none';
        }
    }
    catch (error) {
        console.error('获取环境信息失败:', error);
    }
}
