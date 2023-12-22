function getDom<T extends HTMLElement>(id: string): T {
    return document.getElementById(id) as T;
}
const saveBtn = getDom<HTMLButtonElement>('save');
const getBtn = getDom<HTMLButtonElement>('get');
const removeBtn = getDom<HTMLButtonElement>('remove');
const clearBtn = getDom<HTMLButtonElement>('clear');
const contentBox = getDom<HTMLDivElement>('content-box');
const keyInput = getDom<HTMLInputElement>('key');
const valueInput = getDom<HTMLInputElement>('value');

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
function setData(key: string, value: string) {
    chrome.storage.sync.set({ [key]: value }, () => {
        contentBox.innerHTML = '保存成功!';
    });
}
/** 从账号上同步数据 */
function syncData(key?: string | string[] | Record<string, any>) {
    const args: Parameters<typeof chrome.storage.sync.get> = [
        (obj) => {
            contentBox.innerHTML = JSON.stringify(obj);
        },
    ];
    // @ts-ignore
    if (key && key.length) args.unshift(key);
    chrome.storage.sync.get.apply(chrome.storage.sync, args);
}
/** 删除账号上指定键数据 */
function deleteData(key: string | string[]) {
    if (!(key && key.length)) return;
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

declare const chrome: Chrome;

interface Chrome {
    storage: Storage;
}
interface Storage {
    sync: {
        /**
         * 存储数据
         * @param {object} obj 需存储的数据
         * @param {Function} cb? 可选回调
         */
        set(obj: Record<string, any>, cb?: () => void): void;
        /**
         * 获取数据
         * @param {string|string[]|object} fields 需获取的键
         * @param {Function} cb 获取后的回调
         */
        get<T extends Record<string, any>>(
            fields: string | string[] | Record<string, any>,
            cb: (item: T) => void,
        ): void;
        /**
         * 获取所有数据
         * @param {Function} cb 获取后的回调
         */
        get<T extends Record<string, any>>(cb: (item: T) => void): void;
        /**
         * 删除数据
         * @param {string|string[]|object} fields 需获取的键
         * @param {Function} cb? 删除后的回调
         */
        remove(fields: string | string[], cb?: () => void): void;
        /**
         * 清空数据
         * @param {Function} cb? 清空后的回调
         */
        clear(cb?: () => void): void;
    };
}
