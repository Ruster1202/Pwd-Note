document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOMContentLoaded')
    await init()
    document.getElementById('count').onclick = function () {
        document.getElementById('value').innerHTML++
    }
    document.getElementById('save').onclick = async function () {
        var msg = document.getElementById('store_msg').value;
        await window.electronAPI.storeSet('msg', msg);
    }
    document.getElementById('store_log').onclick = async function () {
        var store = await window.electronAPI.showStore();
        console.log('see store:', store);
    }
    
})
// 初始化操作
async function init() {
    console.log('init');
    // 恢复上次编辑保存的信息
    var store = await window.electronAPI.showStore();
    document.getElementById('store_msg').value = store.msg;
}