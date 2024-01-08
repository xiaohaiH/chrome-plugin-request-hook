"use strict";
/* 数据存储相关 - start
---------------------------- */
/** 保存数据 */
function setData(key, value, cb) {
    chrome.storage.sync.set({ [key]: value }, cb);
}
/** 同步数据 */
function syncData(cb, key) {
    const args = [cb || loop];
    // @ts-ignore
    if (key && key.length)
        args.unshift(key);
    chrome.storage.sync.get.apply(chrome.storage.sync, args);
}
/** 删除指定 key 数据 */
function deleteData(key, cb) {
    if (!(key && key.length))
        return;
    chrome.storage.sync.remove(key, cb);
}
/** 清空数据 */
function clearData(cb) {
    chrome.storage.sync.clear(cb);
}
/* 数据存储相关 - end
---------------------------- */
/* 纯函数相关 - start
---------------------------- */
/** 获取数据类型 */
function getType(o) {
    return Object.prototype.toString.call(o).slice(8, -1);
}
function isString(o) {
    return getType(o) === 'String';
}
/** 将对象的值转为代码 */
function objValueToCode(val) {
    const _val = {};
    Object.keys(val).forEach((k) => {
        // @ts-ignore
        _val[k] = strToCode(val[k]);
    });
    return _val;
}
/** 将字符串转为代码 */
function strToCode(val) {
    try {
        // \n undefined 防止提供的值是注释导致报错
        return eval(`window._aaaa__aa = ${val || '""'}\n undefined,window._aaaa__aa`);
    }
    catch (error) {
        return val;
    }
}
function loop() { }
/* 纯函数相关 - end
---------------------------- */
/* 数据通信相关 - start
---------------------------- */
/**
 * 向当前激活的窗口发送消息
 * @param args
 * @param cb
 */
async function sendMessage(message, cb) {
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
        chrome.tabs.sendMessage(tab.id, message, cb);
    });
}
/* 数据通信相关 - end
---------------------------- */
