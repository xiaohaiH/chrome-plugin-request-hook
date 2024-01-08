/* 数据存储相关 - start
---------------------------- */
/** 保存数据 */
function setData(key: string, value: MatchRuleOption, cb?: () => void) {
    chrome.storage.sync.set({ [key]: value }, cb);
}
/** 同步数据 */
function syncData(cb?: (val: any) => void, key?: string | string[] | Record<string, any>) {
    const args: Parameters<typeof chrome.storage.sync.get> = [cb || loop];
    // @ts-ignore
    if (key && key.length) args.unshift(key);
    chrome.storage.sync.get.apply(chrome.storage.sync, args);
}
/** 删除指定 key 数据 */
function deleteData(key: string | string[], cb?: () => void) {
    if (!(key && key.length)) return;
    chrome.storage.sync.remove(key, cb);
}
/** 清空数据 */
function clearData(cb?: () => void) {
    chrome.storage.sync.clear(cb);
}
/* 数据存储相关 - end
---------------------------- */

/* 纯函数相关 - start
---------------------------- */
/** 获取数据类型 */
function getType(o: any): string {
    return Object.prototype.toString.call(o).slice(8, -1);
}
function isString(o: any): o is string {
    return getType(o) === 'String';
}

/** 将对象的值转为代码 */
function objValueToCode<T extends Record<string, any>>(val: T): T {
    const _val = {} as unknown as T;
    Object.keys(val).forEach((k) => {
        // @ts-ignore
        _val[k] = strToCode(val[k]);
    });
    return _val;
}

/** 将字符串转为代码 */
function strToCode<T extends any>(val: T): T {
    try {
        // \n undefined 防止提供的值是注释导致报错
        return eval(`window._aaaa__aa = ${val || '""'}\n undefined,window._aaaa__aa`);
    } catch (error) {
        return val;
    }
}

function loop() {}
/* 纯函数相关 - end
---------------------------- */

/* 数据通信相关 - start
---------------------------- */
/**
 * 向当前激活的窗口发送消息
 * @param args
 * @param cb
 */
async function sendMessage(message: Record<string, any>, cb?: (...args: any[]) => void) {
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
        chrome.tabs.sendMessage(tab.id, message, cb);
    });
}
/* 数据通信相关 - end
---------------------------- */
