/** 匹配的正则及后续替换的内容 */
const regArr: [RegExp, string | ((str: string, reg: RegExp) => string)][] = [
    [/cdn\.jsdelivr\.net\/npm/, 'fastly.jsdelivr.net/npm'],
];

main();
/**
 * 入口函数
 */
function main() {
    loadScript(`window.regArr = ${convert2CodeString(regArr)}`);
    loadScript('window.wrapperObj = ' + convert2CodeString(core()) + ';window.wrapperObj.init();');
}

function core() {
    const wrapperObj = {
        /** 初始化 */
        init() {
            this.updateHead().updateNewScript().updateFetch().updateXMLHttpRequest();
        },
        /** 检查头部已存在的脚本 url */
        updateHead() {
            const that = this;
            let dom: HTMLScriptElement;
            let _src: string;
            [...(document.head.children as unknown as HTMLScriptElement[])].forEach(function (o) {
                _src = that.replaceUrl(o.src);
                if (o.tagName.toUpperCase() === 'SCRIPT' && o.src !== _src) {
                    dom = document.createElement('script');
                    dom.src = _src;
                    document.head.appendChild(dom);
                }
            }, [] as HTMLScriptElement[]);
            return this;
        },
        /** 检查新增的脚本 url */
        updateNewScript() {
            const that = this;
            let dom: HTMLScriptElement;
            const add = document.head.appendChild.bind(document.head);
            document.head.appendChild = function appendChild<T extends Node>(node: T) {
                dom = node as any;
                if (dom.nodeType === dom.ELEMENT_NODE && dom.tagName.toUpperCase() === 'SCRIPT') {
                    dom.src && (dom.src = that.replaceUrl(dom.src));
                }
                return add(node);
            };
            return this;
        },
        /** 检查 fetch 中的 url */
        updateFetch() {
            const that = this;
            const rawFetch = fetch;
            // @ts-ignore
            window.fetch = function fetch(url, ...args) {
                return typeof url === 'string' ? rawFetch(that.replaceUrl(url), ...args) : rawFetch(url, ...args);
            };
            return this;
        },
        /** 检查 ajax 中的 url */
        updateXMLHttpRequest() {
            const that = this;
            const _open = XMLHttpRequest.prototype.open;
            Object.defineProperty(XMLHttpRequest.prototype, 'open', {
                configurable: false,
                writable: false,
                value: function open(method: string, url: string | URL, ...args: any[]) {
                    return typeof url === 'string'
                        ? // @ts-ignore
                          _open.call(this, method, that.replaceUrl(url), ...args)
                        : // @ts-ignore
                          _open.call(this, method, url, ...args);
                },
            });
            return this;
        },
        /** 更新 url */
        replaceUrl(src: string) {
            let _src = src;
            regArr.forEach(([reg, str]) => {
                reg.test(_src) && (_src = typeof str === 'string' ? _src.replace(reg, str) : str(_src, reg));
            });
            return _src;
        },
    };
    return wrapperObj;
}

/**
 * 加载脚本
 * @param {string} content 脚本内容
 * @param {string} id
 */
function loadScript(content: string, id?: string) {
    const scriptDom = document.createElement('script');
    scriptDom.id = id || `id_${Date.now()}`;
    scriptDom.innerHTML = content;
    scriptDom.type = 'text/javascript';
    scriptDom.async = false;
    document.head.appendChild(scriptDom);
}
/** 将提供的数据转为代码字符串 */
function convert2CodeString(data: any) {
    switch (getType(data)) {
        case 'RegExp':
            return `new RegExp(${JSON.stringify((data as RegExp).source)})`;
        case 'Function':
            const a = data.toString() as string;
            return a.charAt(0) === '(' || a.slice(0, 9) === 'function ' ? a : 'function ' + a;
        case 'Array':
            return array2CodeString(data);
        case 'Object':
            return object2CodeString(data);
        case 'Null':
        case 'Undefined':
            return JSON.stringify(data);
        default:
            return JSON.stringify(data);
    }
}
/** 将数组转为代码字符串 */
function array2CodeString(data: any[], r = '') {
    if (!data.length) return (r += '[]');
    r += '[';
    data.forEach((o, i) => {
        r += `${convert2CodeString(o)}${i === data.length - 1 ? '' : ','}`;
    });
    r += ']';
    return r;
}
/** 将对象转为代码字符串 */
function object2CodeString(data: Record<string, any>, r = '') {
    const keys = Object.keys(data);
    if (!keys.length) return (r += '{}');
    r += '{';
    keys.forEach((o, i) => {
        r += `${o}: ${convert2CodeString(data[o])}${i === keys.length - 1 ? '' : ','}`;
    });
    r += '}';
    return r;
}
/** 获取数据类型 */
function getType(o: any): string {
    return Object.prototype.toString.call(o).slice(8, -1);
}
