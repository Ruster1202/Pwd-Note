document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOMContentLoaded')
    await init()
    
    // 生成密码
    document.getElementById('generate').addEventListener('click', generatePassword);
    // 缓存当前密码
    document.getElementById('save').addEventListener('click', savePassword);
    // 点击查看密码本
    document.getElementById('viewPasswords').addEventListener('click', function () {
        // window.location.href = 'password-book.html';
        console.log('see pwd note...');
    });

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
        data:uppercaseChars,
        name:"uppercaseChars"
    },
    {
        data:lowercaseChars,
        name:"lowercaseChars"
    },
    {
        data:numberChars,
        name:"numberChars"
    },
    {
        data:symbolChars,
        name:"symbolChars"
    }
]

// 当前生成密钥及其规则
const globalCurrentPwd = {
    // 密钥是否初始化
    isInit:false,
    // 密钥内容
    content:"",
    // 密钥规则 1111 四位分别表示是否勾选大写字母，小写字母，数字，符号，范围是0-2^4-1 用户必须至少选择一项，否则则使用随机生成
    rules:0,
    // 密钥长度
    length: {
        minLength: 0,
        maxLength: 0,
    },
    // 密钥标签
    tags:[],
    // 用户名称
    userName:'default'

}
function savePassword() {
    const dom = getDom();
    const password = dom.passwordField.value;
    if (!password) {
        alert('请先生成密码');
        return;
    }

    // 获取密码规则
    const rules = localStorage.getItem('lastRules') || '未知规则';
    const length = localStorage.getItem('lastLength') || '未知长度';

    // 获取当前时间
    const now = new Date();
    const dateStr = now.toLocaleString();

    // 创建密码对象
    const passwordObj = {
        password: password,
        rules: rules,
        length: length,
        date: dateStr
    };

    // 获取现有密码本或初始化
    let passwordBook = JSON.parse(localStorage.getItem('passwordBook') || '[]');

    // 添加新密码
    passwordBook.push(passwordObj);

    // 保存回本地存储
    localStorage.setItem('passwordBook', JSON.stringify(passwordBook));

    alert('密码已保存到密码本');
}

function generatePassword() {
    const dom = getDom();
    // 获取用户设置
    const minLength = parseInt(dom.minLengthInput.value);
    const maxLength = parseInt(dom.maxLengthInput.value);

    // 验证长度范围
    if (minLength > maxLength) {
        alert('最小长度不能大于最大长度');
        return;
    }
    if (minLength < 4 || maxLength > 128) {
        alert('密码长度范围应在4-128之间');
        return;
    }

    // 随机在minLength , maxLength之间生成长度
    const length = Math.floor(Math.random() * (maxLength - minLength + 1)) + minLength;

    // 构建可用字符集
    let charSet = '';
    let rules = [];
    let checkboxList = [dom.uppercaseCheckbox, dom.lowercaseCheckbox, dom.numbersCheckbox, dom.symbolsCheckbox]
    for (let i=0;i<checkboxList.length;i++) {
        if (checkboxList[i].checked) {
            charSet += roleList[i].data;
            rules.push(roleList[i].name)
        }
    }

    // 检查至少选择了一种字符类型
    if (charSet.length === 0) {
        alert('请至少选择一种字符类型');
        return;
    }

    // 生成密码
    let password = '';
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * charSet.length);
        password += charSet[randomIndex];
    }

    // 显示密码
    dom.passwordField.value = password;
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
    console.log('dom:', dom);
    return dom;
}