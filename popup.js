"use strict";
function getDom(id) {
    return document.getElementById(id);
}
const saveBtn = getDom('save');
const getBtn = getDom('get');
const removeBtn = getDom('remove');
const clearBtn = getDom('clear');
const contentBox = getDom('content-box');
const keyInput = getDom('key');
const valueInput = getDom('value');
// 绑定事件
saveBtn.onclick = saveData;
getBtn.onclick = () => syncData();
removeBtn.onclick = removeData;
clearBtn.onclick = clearData;
/** 保存数据 */
function saveData() {
    keyInput.value && valueInput.value ? setData(keyInput.value, valueInput.value) : alert('键值对未全部填写');
}
/** 删除数据 */
function removeData() {
    deleteData(keyInput.value.split(',').filter(Boolean));
}
/** 保存数据到账号上 */
function setData(key, value) {
    chrome.storage.sync.set({ [key]: value }, () => {
        contentBox.innerHTML = '保存成功!';
    });
}
/** 从账号上同步数据 */
function syncData(key) {
    const args = [
        (obj) => {
            contentBox.innerHTML = JSON.stringify(obj);
        },
    ];
    // @ts-ignore
    if (key && key.length)
        args.unshift(key);
    chrome.storage.sync.get.apply(chrome.storage.sync, args);
}
/** 删除账号上指定键数据 */
function deleteData(key) {
    if (!(key && key.length))
        return;
    chrome.storage.sync.remove(key, () => {
        contentBox.innerHTML = '删除成功!';
    });
}
/** 清空账号上的数据 */
function clearData() {
    chrome.storage.sync.clear(() => {
        contentBox.innerHTML = '清空成功!';
    });
}
