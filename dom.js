document.addEventListener('DOMContentLoaded', () => {
    console.log('DOMContentLoaded')
    document.getElementById('app').onclick = function () {
        console.log('点击！！！');
        document.getElementById('count').innerHTML++
    }
})