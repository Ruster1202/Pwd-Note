// TODO:自定义使用布局
// TODO:控制宽度为固定几个模板
// TODO:提供一个历史密码生成列表，避免点击太快看不到曾经生成过的密码
document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOMContentLoaded')
    await init()
    // 生成密码
    document.getElementById('generate').addEventListener('click', generatePassword);
    // 缓存当前密码
    document.getElementById('save').addEventListener('click', savePassword);
    // 点击查看密码本
    document.getElementById('viewPasswords').addEventListener('click', viewPasswords);
    // 挂载工具栏 reset-store
    document.getElementById('reset-store').addEventListener('click', loadResetTool);
    document.getElementById('check-store').addEventListener('click', loadCheckTool);
    document.getElementById('generate-store').addEventListener('click', loadGenerateTool);

    // 监控生成条件改变  
    const els = document.querySelectorAll('#uppercase, #lowercase, #numbers, #symbols, #minLength, #maxLength');
    els.forEach(el => el.addEventListener('change', handleConditionChange));
})



// 初始化操作
async function init() {
    console.log('init');
}
// 字符集定义
const lowercaseChars = 'abcdefghijklmnopqrstuvwxyz';
const uppercaseChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const numberChars = '0123456789';
const symbolChars = '!@#$%^&*()_+-=[]{}|;:,.<>?~';
// const roleList = [uppercaseChars,lowercaseChars,numberChars,symbolChars]
const roleList = [
    {
        data: uppercaseChars,
        name: "uppercaseChars"
    },
    {
        data: lowercaseChars,
        name: "lowercaseChars"
    },
    {
        data: numberChars,
        name: "numberChars"
    },
    {
        data: symbolChars,
        name: "symbolChars"
    }
]

// 当前生成密钥及其规则
const globalCurrentPwd = {
    // 密钥ID,就是UUID
    id: null,
    // TODO: 记得设置时区为东八区，不然切换代理函数就有问题
    // 创建时间
    // createTime: new Date().toLocaleString(),
    createTime: null,
    // 密钥是否修改
    isModify: false,
    // 修改时间
    modifyTime: null,
    // 密钥内容
    content: "",
    // 用户账号昵称  后续自己在编辑界面自己设置
    account: "",
    // 密钥说明
    description: "",
    // 密钥使用网址
    url: "",
    // 密钥规则 1111 四位分别表示是否勾选大写字母，小写字母，数字，符号，范围是0-2^4-1 用户必须至少选择一项，否则则使用随机生成
    // 先用string[]代替，后续再改
    rules: [],
    // 密钥长度
    length: {
        minLength: 0,
        maxLength: 0,
    },
    // 密钥标签
    tags: [],
    // 创建用户名称
    userName: 'default'
}

function initGlobalCurrentPwd() {
    globalCurrentPwd.id = null;
    globalCurrentPwd.isModify = false;
    globalCurrentPwd.content = "";
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
        // alert('请先生成密码');
        window.electronAPI.showTip('error', '请先生成密码');
        return;
    }

    // 保存密码到本地存储
    let res = await window.electronAPI.addPwdRecord(globalCurrentPwd);
    res ? window.electronAPI.showTip('success', '密码已保存到密码本！') : window.electronAPI.showTip('error', '密码已存在，请勿重复添加！');
}

async function viewPasswords() {
    console.log('viewPasswords');
    let store = await window.electronAPI.showStore();
    console.log('store:', store);
    // window.electronAPI.viewPasswords();
    // 打开视图
    window.electronAPI.openListWindow(store.pwdRecords || []);
    // await window.electronAPI.openListWindow();
}
async function generatePassword() {

    initGlobalCurrentPwd();
    const dom = getDom();
    // 获取用户设置
    const minLength = parseInt(dom.minLengthInput.value);
    const maxLength = parseInt(dom.maxLengthInput.value);


    // 生成密码
    let password = '';
    // 验证长度范围
    if (minLength > maxLength) {
        alert('最小长度不能大于最大长度');
        return false;
    }
    if (minLength < 4 || maxLength > 128) {
        alert('密码长度范围应在4-128之间');
        return false;
    }

    // 随机在minLength , maxLength之间生成长度
    let length = Math.floor(Math.random() * (maxLength - minLength + 1)) + minLength;
    console.log('see pwd length:', length);
    // 构建可用字符集
    let charSet = '';
    let rules = [];
    let checkboxList = [dom.uppercaseCheckbox, dom.lowercaseCheckbox, dom.numbersCheckbox, dom.symbolsCheckbox]
    for (let i = 0; i < checkboxList.length; i++) {
        if (checkboxList[i].checked) {
            charSet += roleList[i].data;
            rules.push(roleList[i].name)
            // 保底密码
            const randomIndex = Math.floor(Math.random() * roleList[i].data.length);
            password += roleList[i].data[randomIndex];
        }
    }

    // 检查至少选择了一种字符类型
    if (charSet.length === 0) {
        alert('请至少选择一种字符类型');
        return false;
    }
    length -= password.length
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * charSet.length);
        password += charSet[randomIndex];
    }
    // 再整体shuffle
    password = password.split('').sort(() => Math.random() - 0.5).join('');
    // 打乱顺序以避免模式化 可选分支步骤
    // for (let i = passwordChars.length - 1; i > 0; i--) {
    //     const j = Math.floor(Math.random() * (i + 1));
    //     [passwordChars[i], passwordChars[j]] = [passwordChars[j], passwordChars[i]];
    // }
    // 保存规则和长度到本地数据结构
    globalCurrentPwd.id = await window.electronAPI.getUUID();
    globalCurrentPwd.content = password;
    globalCurrentPwd.rules = rules;
    globalCurrentPwd.length.minLength = minLength;
    globalCurrentPwd.length.maxLength = maxLength;
    globalCurrentPwd.createTime = new Date().toLocaleString();
    // 显示密码
    dom.passwordField.value = password;
    return true
}
async function loadResetTool() {
    let res = await window.electronAPI.resetStore();
    res ? window.electronAPI.showTip('success', '存储已重置！') : window.electronAPI.showTip('error', '存储重置失败！');
}
async function loadCheckTool() {
    let store = await window.electronAPI.showStore();
    console.log('check-store:', store);
    window.electronAPI.showTip('success', '存储已打印到控制台！');
}
async function loadGenerateTool() {

    // 生成10条随机密码，长度在8-16之间
    for (let i = 0; i < 10; i++) {
        let resGenerate = await generatePassword();
        if (!resGenerate) {
            window.electronAPI.showTip('error', '生成失败,请查看提示！');
            return;
        }
        await savePassword();
    }
    window.electronAPI.showTip('success', '批量密码已生成并保存到密码本！');
}
function getDom() {
    // 获取DOM元素
    // 使用.value
    const minLengthInput = document.getElementById('minLength');
    const maxLengthInput = document.getElementById('maxLength');
    // 使用.checked
    const lowercaseCheckbox = document.getElementById('lowercase');
    const uppercaseCheckbox = document.getElementById('uppercase');
    const numbersCheckbox = document.getElementById('numbers');
    const symbolsCheckbox = document.getElementById('symbols');
    // 实体dom
    const passwordField = document.getElementById('password');

    const dom = { minLengthInput, maxLengthInput, lowercaseCheckbox, uppercaseCheckbox, numbersCheckbox, symbolsCheckbox, passwordField };
    // console.log('dom:', dom);
    return dom;
}

function handleConditionChange() {
    const dom = getDom();
    // 只用重置密码即可，防止提交  规则-密码内容 不一致的记录
    dom.passwordField.value = '';
}