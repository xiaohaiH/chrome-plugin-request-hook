// https://npm.onmicrosoft.cn   类似 https://unpkg.com/         举例 https://unpkg.com/vue@2.6.0/types/index.d.ts
// https://jsd.onmicrosoft.cn   类似 https://www.jsdelivr.com/  举例 https://cdn.jsdelivr.net/npm/vue@2.6.0/types/index.d.ts
// https://fastly.jsdelivr.net  类似 https://www.jsdelivr.com/  举例 https://cdn.jsdelivr.net/npm/vue@2.6.0/types/index.d.ts

const defaultRuleStr: Record<string, MatchRuleOption> = {
    jsdelivr: {
        group: 'cdn源切换',
        name: 'cdn.jsdelivr.net',
        reg: '/cdn.jsdelivr.net\\/npm/',
        replacer: ['fastly.jsdelivr.net/npm', '// jsd.onmicrosoft.cn/npm', '// npm.onmicrosoft.cn'].join('\n'),
        enable: true,
    },
    xhrRequest: {
        group: 'XMLHttpResponse示例',
        name: '改变请求值+token',
        reg: '/v1\\/prison\\/device\\/list/',
        enable: false,
        // @ts-ignore
        reqHandler: [
            `function reqHandler(req) {`,
            `    // code...`,
            `    req.setRequestHeader('token', '123');`,
            `    // req.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');`,
            `    req.method = 'POST';`,
            `    req.params = { roleKey: 123, roleName: 'ab' };`,
            `    req.data = JSON.stringify({ roleKey222: 123, roleName: 'ab' });`,
            `    // req.data = 'roleKey=123&roleName=ab';`,
            `    // req.data = new FormData(); req.data.append('aa', 666)`,
            `    console.log(req);`,
            `}`,
        ].join('\n'),
    },
    xhrResponse: {
        group: 'XMLHttpResponse示例',
        name: '改变响应值',
        reg: '/v1\\/prison\\/device\\/list/',
        enable: false,
        // @ts-ignore
        resHandler: [
            `function resHandler(res) {`,
            `    // code...`,
            `    const data = JSON.parse(res.response);`,
            `    data.data.total = 5;`,
            `    data.data.rows = data.data.rows.slice(0, 5);`,
            `    const descriptor = { configurable: true, enumerable: true, writable: true, value: JSON.stringify(data) };`,
            `    Object.defineProperties(res, { response: descriptor, responseText: descriptor });`,
            `}`,
        ].join('\n'),
    },
    fetchRequest: {
        group: 'fetch示例',
        name: '改变请求值',
        reg: '/system\\/v1\\/criminal\\/list/',
        enable: false,
        // @ts-ignore
        reqHandler: [
            `function reqHandler(req) {`,
            `    // code...`,
            `    // req.method = 'POST';`,
            `    req.params = { a: 1, b: 2, c: 3 };`,
            `    // req.body = JSON.stringify({ bbq: 666 });`,
            `}`,
        ].join('\n'),
    },
    fetchResponse: {
        group: 'fetch示例',
        name: '改变响应值',
        reg: '/system\\/v1\\/criminal\\/list/',
        enable: false,
        // @ts-ignore
        resHandler: [
            `function resHandler(res) {`,
            `    // code...`,
            `    const _json = res.json;`,
            `    res.json = function json() {`,
            `        return _json.call(this).then((v) => {`,
            `            console.log(v);`,
            `            v.data.total = v.data.rows.length = 5;`,
            `            return v;`,
            `        });`,
            `    };`,
            `}`,
        ].join('\n'),
    },
};

const defaultRegSet = Object.entries(defaultRuleStr).reduce((p, [k, v]) => {
    p[k] = { rule: objValueToCode(v), originRule: v };
    return p;
}, {} as Record<string, { rule: MatchRuleOption; originRule: any }>);

/** 匹配的正则及后续替换的内容 */
let regSet: Record<string, { rule: MatchRuleOption; originRule: any }> = { ...defaultRegSet };
/** 正则集合 */
let regArr = Object.values(regSet)
    .filter((v) => v.rule.enable)
    .map((v) => v.rule);
/** 从存储中同步数据 */
function syncDataByStorage() {
    syncData((val) => {
        // 示例不存在时, 自动保存示例
        if (!(val && Object.keys(val).length)) {
            chrome.storage.sync.set(defaultRuleStr);
        }
        try {
            regSet = { ...defaultRegSet };
            Object.keys(val).forEach((k) => {
                regSet[k] = {
                    rule: objValueToCode(val[k]),
                    originRule: val[k],
                };
            });

            regArr = Object.values(regSet)
                .filter((v) => v.rule.enable)
                .map((v) => v.rule);

            updateScript('data', `window.regArr = ${convert2CodeString(regArr)};`);
        } catch (error) {
            console.error(error);
        }
        main();
    });
}
syncDataByStorage();
chrome.storage.onChanged.addListener(syncDataByStorage);

/** 数据脚本钩子 */
const scriptDomMap: Partial<Record<'data' | 'operate', HTMLScriptElement>> = {};

// main();
let init = false;
/**
 * 入口函数
 */
function main() {
    if (init) return;
    init = true;
    updateScript('data', `window.regArr = ${convert2CodeString(regArr)};`);
    updateScript('operate', 'window.wrapperObj = ' + convert2CodeString(core()) + ';window.wrapperObj.init();');
}

function core() {
    const wrapperObj = {
        /** 初始化 */
        init() {
            this
                // -
                .updateHead()
                .updateNewScript()
                .updateFetch()
                .updateXMLHttpRequest();
        },
        /** 检查头部已存在的脚本 url */
        updateHead() {
            const that = this;
            let dom: HTMLScriptElement;
            [...(document.head.children as unknown as HTMLScriptElement[])].forEach(function (o) {
                if (!(o.tagName.toUpperCase() === 'SCRIPT' && o.src)) return;
                const { src } = that.replaceUrl(o.src);
                if (o.src === src) return;
                dom = document.createElement('script');
                dom.src = src;
                document.head.appendChild(dom);
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
                if (dom.nodeType === dom.ELEMENT_NODE && dom.tagName.toUpperCase() === 'SCRIPT' && dom.src) {
                    dom.src = that.replaceUrl(dom.src).src;
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
            window.fetch = function fetch(url, init?) {
                if (typeof Request && url instanceof Request) return rawFetch(url, init);
                let newInit: RequestInit & { params?: Record<string, any> } = { ...init };
                let urlStr = url as string;
                if (typeof url !== 'string') {
                    if (typeof URL && url instanceof URL) {
                        urlStr = url.toString();
                    }
                }
                let { src, plugins } = that.replaceUrl(urlStr);

                function proxyRes(res: Response) {
                    if (!plugins.length) return res;
                    const __res = res.clone;
                    plugins.forEach((v) => that.captureErrorByCallback(() => v.resHandler?.(res), v));
                    res.clone = function clone() {
                        return proxyRes(__res.call(this));
                    };
                    return res;
                }

                plugins.forEach((v) => v.reqHandler?.(newInit));
                if (newInit.params) {
                    const [_src, _existParams] = src.split('?');
                    src = _src + '?';
                    const _params: Record<string, any> = {};
                    let k: string, v: string;
                    _existParams &&
                        _existParams.split('&').forEach((o) => {
                            [k, v] = o.split('=');
                            k && (_params[k] = v);
                        });
                    Object.entries({ ..._params, ...newInit.params }).forEach(([k, v]) => {
                        if (!k) return;
                        src += `${k}=${v}&`;
                    });
                    src = src.slice(0, -1);
                }

                return rawFetch(src, newInit).then(proxyRes);
            };
            return this;
        },
        /** 检查 ajax 中的 url */
        updateXMLHttpRequest() {
            const that = this;
            const rawXMLHttpRequest = window.XMLHttpRequest;
            Object;
            const paramsEncode = {
                /** url参数格式 */
                get String() {
                    return this.URLSearchParams;
                },
                URLSearchParams: {
                    value: new URLSearchParams(),
                    handler(k: string, v: string) {
                        if (!k) return this.value;
                        this.value.append(k, v);
                    },
                    get() {
                        return this.value;
                    },
                    reset() {
                        this.value = new URLSearchParams();
                    },
                },
                // String: {
                //     value: '',
                //     handler(k: string, v: string) {
                //         if (!k) return this.value;
                //         this.value += `&${k}=${v}`;
                //     },
                //     get() {
                //         return this.value.slice(1);
                //     },
                //     reset() {
                //         this.value = '';
                //     },
                // },
                // get URLSearchParams() {
                //     return this.String;
                // },
                /** json 格式 */
                Object: {
                    value: {} as Record<string, any>,
                    handler(k: string, v: string) {
                        this.value[k] = v;
                    },
                    get() {
                        return JSON.stringify(this.value);
                    },
                    reset() {
                        this.value = {};
                    },
                },
                /** FormData 格式 */
                FormData: {
                    value: new FormData(),
                    handler(k: string, v: string) {
                        this.value.append(k, v);
                    },
                    get() {
                        return this.value;
                    },
                    reset() {
                        this.value = new FormData();
                    },
                },
            };

            class XMLHttpRequest extends rawXMLHttpRequest {
                /** 待执行的插件 - 插件只执行一次, 防止多次执行 */
                plugins: Partial<MatchRuleOption>[] = [];
                /** 执行的插件备份 */
                pluginsBackup: Partial<MatchRuleOption>[] = [];

                stateMap = {} as Record<string, 1>;
                /** 拦截属性上的事件 */
                listenerXhrEnd(type: 'onreadystatechange' | 'onload' | 'onloadend') {
                    if (this.stateMap[type]) return;
                    this.stateMap[type] = 1;
                    const readystatechange = (ev: Event) => {
                        if (this.readyState === 4) {
                            this.carryPlugins(() => super.removeEventListener('readystatechange', readystatechange));
                            // 非 onreadystatechange 仅在完成时执行即可
                            // @ts-ignore
                            type !== 'onreadystatechange' && this[type]?.(ev);
                        }
                        // onreadystatechange 需要每次都执行
                        type === 'onreadystatechange' && this[type]?.(ev);
                    };
                    super.addEventListener('readystatechange', readystatechange);
                }

                constructor() {
                    super();
                    // class 原型上的方法不能被枚举到
                    // 将原型上的方法增加到实例上
                    ['open', 'send', 'setRequestHeader', 'addEventListener'].forEach((k) => {
                        Object.defineProperty(this, k, {
                            configurable: true,
                            enumerable: true,
                            writable: true,
                            // @ts-ignore
                            value: this[k],
                        });
                    });
                    let aabb: Record<string, any> = {};
                    ['onload', 'onloadend', 'onreadstatechange'].forEach((k) => {
                        Object.defineProperty(this, k, {
                            configurable: true,
                            enumerable: true,
                            get() {
                                return aabb[k];
                            },
                            set(val) {
                                aabb[k] = val;
                                this.listenerXhrEnd(k);
                            },
                        });
                    });
                }
                cacheSetHeaders = {} as Record<string, any>;
                setRequestHeader(name: string, value: string): void {
                    this.cacheSetHeaders[name] = value;
                    super.setRequestHeader(name, value);
                }
                /** 传递给后台的参数 */
                data: FormData | URLSearchParams | string | null = null;
                params: FormData | URLSearchParams | string | null = null;
                /** 请求的方法类型 */
                method = '';
                open(method: string, url: string | URL): void;
                open(
                    method: string,
                    url: string | URL,
                    async: boolean,
                    username?: string | null | undefined,
                    password?: string | null | undefined,
                ): void;
                open(
                    method: string,
                    _url: string | URL,
                    async?: boolean,
                    username?: string | null | undefined,
                    password?: string | null | undefined,
                ): void {
                    let url = _url.toString();
                    const { src, plugins } = that.replaceUrl(url);
                    if (!plugins.length) {
                        const params: any = [method, _url, async, username, password].filter(
                            (v) => typeof v !== 'undefined',
                        );
                        return rawXMLHttpRequest.prototype.open.apply(this, params);
                    }
                    this.plugins = plugins;
                    // 用来获取设置的参数 -- start
                    const tempXhr = new rawXMLHttpRequest();
                    this.plugins.forEach((o) => {
                        o.reqHandler?.(tempXhr);
                    });
                    // @ts-ignore
                    this.method = tempXhr.method;
                    // @ts-ignore
                    this.params = tempXhr.params;
                    // // @ts-ignore
                    // this.data = tempXhr.data;
                    // 用来获取设置的参数 -- end

                    this.pluginsBackup = plugins.map((v) => ({ ...v }));
                    let str = '';
                    if (this.params) {
                        const a = new URLSearchParams();
                        Object.keys(this.params).forEach((k) => {
                            // @ts-ignore
                            a.append(k, this.params[k]);
                        });
                        str = (src.indexOf('?') === -1 ? '?' : '&') + a.toString();
                    }

                    // async 默认值为 true, 当未传值时
                    // undefined 会认定为 false
                    // 可能导致一些奇怪的报错, 因此用 filter 过滤一遍
                    const params: any = [this.method || method, src + str, async!, username, password].filter(
                        (v) => typeof v !== 'undefined',
                    );
                    // @ts-ignore
                    return rawXMLHttpRequest.prototype.open.apply(this, params);
                    // super.open.apply(this, params);
                }
                send(body?: Document | XMLHttpRequestBodyInit | null | undefined): void {
                    // 在传参前执行插件方法, 以便覆盖
                    this.plugins.forEach((o) => {
                        o.reqHandler?.(this);
                    });
                    if (!this.plugins.length) return super.send(body);
                    // Content-Type                         提供的参数                           对应的规则
                    // application/x-www-form-urlencoded -> string | URLSearchParams      ->    kv(url 路径参数)
                    // application/json                  -> string                        ->    json
                    // multipart/form-data               -> FormData

                    // 提供的参数在 contentType 在解析规则内, 则两者合并
                    // 否则优先取插件提供的
                    const contentType = this.cacheSetHeaders['Content-Type'];

                    const paramsDecode = {
                        String: [
                            'application/x-www-form-urlencoded',
                            (val: string | URLSearchParams, cb: (k: string, v: any) => void) => {
                                if (!val) return;
                                if (typeof val !== 'string') {
                                    paramsDecode.URLSearchParams[1](val, cb);
                                    return;
                                }
                                try {
                                    JSON.parse(val);
                                    paramsDecode.Object[1](val, cb);
                                    return;
                                } catch (error) {
                                    let k, v;
                                    val.split('&').forEach((o) => {
                                        [k, v] = o.split('=');
                                        k && cb(k, v);
                                    });
                                }
                            },
                        ],
                        URLSearchParams: [
                            'application/x-www-form-urlencoded',
                            (val: URLSearchParams, cb: (k: string, v: any) => void) => {
                                if (!val) return;
                                // @ts-ignore
                                [...val].forEach(([k, v]) => cb(k, v));
                            },
                        ],
                        Object: [
                            'application/json',
                            (val: string, cb: (k: string, v: any) => void) => {
                                if (!val) return;
                                try {
                                    Object.entries(JSON.parse(val)).forEach(([k, v]) => cb(k, v));
                                } catch (error) {}
                            },
                        ],
                        FormData: [
                            'multipart/form-data',
                            (val: FormData, cb: (k: string, v: any) => void) => {
                                if (!val) return;
                                // @ts-ignore
                                [...val].forEach(([k, v]) => cb(k, v));
                            },
                        ],
                    } as const;

                    let getParamsEncode: (typeof paramsEncode)[keyof typeof paramsDecode] | null = null;
                    contentType &&
                        Object.entries(paramsDecode).some(([k, [type]]) => {
                            if (contentType.indexOf(type) !== -1) {
                                getParamsEncode = paramsEncode[k as keyof typeof paramsDecode];
                                return true;
                            }
                            return false;
                        });

                    const parseData = (v: any) => {
                        try {
                            return JSON.parse(v);
                        } catch (error) {
                            return v;
                        }
                    };

                    !getParamsEncode &&
                        this.data &&
                        (getParamsEncode = paramsEncode[that.getType(parseData(this.data)) as 'String']);

                    let params: any = this.data || body;
                    if (getParamsEncode) {
                        this.data &&
                            paramsDecode[that.getType(this.data) as 'String']?.[1](
                                // @ts-ignore
                                this.data,
                                getParamsEncode.handler.bind(getParamsEncode),
                            );
                        body &&
                            paramsDecode[that.getType(body) as 'String']?.[1](
                                // @ts-ignore
                                body,
                                getParamsEncode.handler.bind(getParamsEncode),
                            );
                        params = getParamsEncode.get();
                        getParamsEncode.reset();
                    }

                    super.send(params);
                }
                addEventListener<K extends keyof XMLHttpRequestEventMap>(
                    type: K,
                    listener: (this: XMLHttpRequest, ev: XMLHttpRequestEventMap[K]) => any,
                    options?: boolean | AddEventListenerOptions | undefined,
                ): void;
                addEventListener(
                    type: string,
                    listener: EventListenerOrEventListenerObject,
                    options?: boolean | AddEventListenerOptions | undefined,
                ): void;
                addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean): void {
                    // console.error('%c监听事件', 'color:#e1ebad;font-size: 30px;background:#c3aa25', arguments, this);
                    if (['readystatechange', 'load', 'loadend'].includes(type)) {
                        const cb = () => {
                            this.carryPlugins(() => super.removeEventListener(type, cb));
                        };
                        super.addEventListener(type, cb);
                    }
                    super.addEventListener(type, listener, options);
                }
                /** 执行绑定的插件 */
                carryPlugins(cb?: () => void) {
                    this.readyState === 4 &&
                        this.plugins.forEach((v) =>
                            that.captureErrorByCallback(() => {
                                v.resHandler?.(this);
                                delete v.resHandler;
                            }, v),
                        );
                    cb?.();
                }
            }
            window.XMLHttpRequest = XMLHttpRequest;

            return this;
        },
        /** 合并数据 */
        /** 拦截回调中的报错 */
        captureErrorByCallback(cb: () => void, ...args: any[]) {
            try {
                cb();
            } catch (error) {
                console.error('%c插件报错', 'color:#e1ebad;font-size: 30px;background:#c3aa25', error, ...args);
            }
        },
        /** 更新 url */
        replaceUrl(src: string) {
            const result: { src: string; plugins: Partial<MatchRuleOption>[] } = { src, plugins: [] };
            regArr.forEach(({ reg, replacer, debug, debugAtMatching, ...args }) => {
                if (debug) debugger;
                if (this.isString(reg) ? reg === result.src : reg.test(result.src)) {
                    if (debugAtMatching) debugger;
                    replacer &&
                        (result.src = this.isString(replacer)
                            ? result.src.replace(reg, replacer)
                            : replacer(result.src, this.isString(reg) ? new RegExp(reg) : reg));
                    result.plugins.push(args);
                }
            });
            return result;
        },
        getType,
        isString(val: any): val is string {
            return this.getType(val) === 'String';
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
    return scriptDom;
}
/** 更新脚本内容 */
function updateScript(scriptName: keyof typeof scriptDomMap, content: string) {
    scriptDomMap[scriptName] && document.head.removeChild(scriptDomMap[scriptName]!);
    scriptDomMap[scriptName] = loadScript(content);
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
