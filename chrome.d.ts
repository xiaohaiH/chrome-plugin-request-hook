declare const chrome: Chrome;

interface Chrome {
    storage: Storage;
    runtime: Runtime;
    tabs: Tabs;
}
interface Storage {
    sync: {
        /**
         * 存储数据
         * @param {object} obj 需存储的数据
         * @param {Function} cb? 可选回调
         */
        set(obj: Record<string, DataOption>, cb?: () => void): void;
        /**
         * 获取数据
         * @param {string|string[]|object} fields 需获取的键
         * @param {Function} cb 获取后的回调
         */
        get(fields: string | string[] | Record<string, any>, cb: (item: Record<string, DataOption>) => void): void;
        /**
         * 获取所有数据
         * @param {Function} cb 获取后的回调
         */
        get(cb: (item: Record<string, DataOption>) => void): void;
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
    onChanged: {
        /**
         * 存储发生改变时触发
         */
        addListener(cb: () => void): void;
    };
}
interface Runtime {
    /**
     * 发送数据
     * @param {*} params 传递的参数
     * @param {Function} [cb] 传参后对方执行的回调
     */
    sendMessage(params: any, cb?: (...args: any[]) => void): void;
    /**
     * @param {*} id 扩展或页面 id
     * @param {*} params 传递的参数
     * @param {Function} [cb] 传参后对方执行的回调
     */
    sendMessage(id: string, params: any, cb?: (...args: any[]) => void): void;
    onMessage: {
        /**
         * 监听消息
         * @param {*} params content 传递的参数
         * @param {*} sender
         * @param {Function} cb 回传过去的数据
         */
        addListener(cb: (params: any, sender: any, cb: (...args: any) => void) => void): void;
    };
}
interface Tabs {
    /**
     * 查询页面
     * @param {Object} option 查询的参数
     * @param {Function} cb
     */
    query(option: { active?: boolean; currentWindow?: boolean }, cb: (...args: any) => void): void;
    /** 发送消息 */
    sendMessage: Runtime['sendMessage'];
}
