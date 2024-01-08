/** 当前操作的数据 key */
let operationKey = '';
/** 生成唯一 id */
function generateId() {
    return `${Date.now()}${~~(Math.random() * 100)}`;
}
const contentDom = document.getElementsByClassName('content')[0];

// 创建当前已保存的数据集合
/** 当前所保存的数据 */
let source: Record<string, MatchRuleOption>;
const treeDom = document.createElement('div');
/** 设置激活的树节点 */
function setActiveTree(key: string | HTMLDivElement) {
    const _key = isString(key) ? key : key.dataset.key!;
    // if (operationKey === _key) return;

    operationKey = _key;
    source[_key] && setFormValue(source[_key]);
    resetActiveState((el) => {
        el.dataset.key === _key && (el.className = 'is-active');
    });

    const delDom = formDom.getElementsByClassName('del-btn')[0] as HTMLButtonElement;
    delDom && (delDom.style.display = 'inline-block');
}
/** 重置树列表状态 */
function resetActiveState(cb?: (dom: HTMLDivElement) => void) {
    [...treeDom.getElementsByTagName('p')].forEach((o) => {
        o.className = '';
        cb?.(o);
    });
}
/** 生成接口树 */
{
    contentDom.appendChild(treeDom);
    function generateTreeContent(data: Record<string, MatchRuleOption>) {
        source = data;
        const a: Record<string, string> = {};
        Object.entries(data)
            .sort((a, b) => (a[1].sort || Infinity) - (b[1].sort || Infinity))
            .forEach(([k, v], i) => {
                if (!a[v.group || '']) a[v.group || ''] = '';
                a[v.group || ''] += `<p data-key="${k}">${v.name}</p>`;
            });
        treeDom.innerHTML = Object.entries(a).reduce((p, [name, v], i) => {
            return (p += name ? `<details open="${!i}"><summary>${name}</summary>${v}</details>` : v);
        }, '');
        if (Object.keys(source).length && Object.keys(source).indexOf(operationKey) === -1) {
            operationKey = Object.keys(source)[0];
        }
        operationKey && setActiveTree(operationKey);
    }
    chrome.storage.onChanged.addListener(() => syncData(generateTreeContent));
    syncData(generateTreeContent);
    let target: HTMLDivElement;
    treeDom.addEventListener('click', (ev) => {
        target = ev.target as HTMLDivElement;
        if (!(target.dataset.key && source[target.dataset.key])) return;
        setActiveTree(target.dataset.key);
    });
}
// 创建新增数据所需的节点
const formDom = document.createElement('form');

function setFormValue(key: Partial<MatchRuleOption> | string) {
    const val = typeof key === 'string' ? source[key] : key;
    const doms: HTMLInputElement[] = [];
    ['input', 'textarea'].forEach((o) => {
        // @ts-ignore
        doms.push(...formDom.getElementsByTagName(o));
    });
    doms.forEach((el) => {
        // @ts-ignore
        el[el.type === 'checkbox' ? 'checked' : 'value'] =
            val[el.name as 'name'] === undefined ? formDefaultValue[el.name as 'name'] : val[el.name as 'name'];
    });
    typeof key === 'string' && (operationKey = key);
}

/** 表单默认值 */
const formDefaultValue = {
    name: '',
    group: '',
    sort: '',
    enable: true,
    debug: false,
    debugAtMatching: false,
    reg: '',
    replacer: ['function replacer(str, reg) {', '    // code...', '    return str;', '}'].join('\n'),
    reqHandler: ['function reqHandler(req) {', '    // code...', '    ', '}'].join('\n'),
    resHandler: ['function resHandler(res) {', '    // code...', '    ', '}'].join('\n'),
};
// 创建表单
{
    /** 创建输入框 */
    function createTextarea({
        label,
        value,
        placeholder,
        tag,
        name,
        title,
        ...args
    }: {
        label: string;
        value: string;
        name: string;
        placeholder?: string;
        type?: string;
        checked?: boolean;
        tag?: 'input' | 'textarea';
        title?: string;
    }) {
        const wrap = document.createElement('label');
        title && (wrap.title = title);
        const titleDom = document.createElement('div');
        titleDom.innerHTML = label;
        titleDom.className = 'flex-none mr-4 mb-4 mt-4';
        wrap.appendChild(titleDom);

        const dom = document.createElement(tag || 'textarea');
        dom.value = value;
        dom.placeholder = placeholder || label;
        dom.name = name;
        dom.id = name;
        Object.assign(dom, args);
        wrap.appendChild(dom);
        return wrap;
    }
    function createRowBox(doms: HTMLElement[]) {
        const wrapDom = document.createElement('div');
        wrapDom.style.display = 'flex';
        doms.forEach((o, idx) => {
            wrapDom.appendChild(o);
            Object.assign(o.style, {
                display: 'flex',
                width: `calc(${~~((1 / doms.length) * 10000) / 100}% - 10px)`,
                flexGrow: 1,
                alignItems: 'center',
            });
            idx && (o.style.marginLeft = '10px');
        });
        return wrapDom;
    }
    formDom.action = '';
    formDom.method = 'get';
    [
        createRowBox([
            createTextarea({
                label: '名称',
                value: formDefaultValue.name,
                placeholder: '名称(该脚本的作用)',
                tag: 'input',
                name: 'name',
            }),
            createTextarea({
                label: '分组',
                value: formDefaultValue.group,
                placeholder: '分组',
                tag: 'input',
                name: 'group',
            }),
            createTextarea({
                label: '排序',
                value: formDefaultValue.sort,
                placeholder: '排序',
                tag: 'input',
                type: 'number',
                name: 'sort',
            }),
        ]),
        createRowBox([
            createTextarea({
                label: '启用该规则',
                value: '',
                checked: formDefaultValue.enable,
                placeholder: '',
                tag: 'input',
                type: 'checkbox',
                name: 'enable',
            }),
            createTextarea({
                label: '开启debug',
                value: '',
                checked: formDefaultValue.debug,
                placeholder: 'debugger',
                tag: 'input',
                type: 'checkbox',
                name: 'debug',
            }),
            createTextarea({
                label: '仅在规则命中时开启debug',
                value: '',
                checked: formDefaultValue.debugAtMatching,
                placeholder: 'debugger',
                tag: 'input',
                type: 'checkbox',
                name: 'debugAtMatching',
            }),
        ]),
        createTextarea({
            label: '路径匹配',
            value: formDefaultValue.reg,
            placeholder: '路径匹配(正则or字符串) -> /test/',
            tag: 'input',
            name: 'reg',
        }),
        createTextarea({
            label: '路径替换',
            value: formDefaultValue.replacer,
            placeholder: '字符串或函数',
            name: 'replacer',
        }),
        createTextarea({
            label: '处理请求头',
            value: formDefaultValue.reqHandler,
            name: 'reqHandler',
            title: [
                'xhr 提供的是该对象本身',
                'fetch 提供的是其参数项',
                '拓展了fetch的params属性, 会与接口本身的参数进行合并',
                'body 参数需自身处理(接口本身传递了 body 参数, 通过 res.body 能获取到)',
            ].join('\n'),
        }),
        createTextarea({ label: '处理返回值', value: formDefaultValue.resHandler, name: 'resHandler' }),
    ].forEach((o) => formDom.appendChild(o));
    const submitDom = document.createElement('button');
    submitDom.textContent = '保存';
    submitDom.type = 'submit';
    const resetDom = document.createElement('button');
    resetDom.textContent = '重置';
    resetDom.type = 'reset';
    const delDom = document.createElement('button');
    delDom.textContent = '删除';
    delDom.type = 'button';
    delDom.className = 'del-btn';
    delDom.style.display = 'none';
    const a = document.createElement('div');
    Object.assign(a.style, { textAlign: 'right' });

    formDom.addEventListener('submit', function (ev) {
        ev.preventDefault();
        const params = [...new FormData(ev.target as HTMLFormElement).entries()].reduce((p, v) => {
            // @ts-ignore
            p[v[0]] = v[1];
            return p;
        }, {} as MatchRuleOption);

        if (!(params.name && params.reg)) {
            return alert('<名称>与<路径匹配>为必填项');
        }
        // Object.entries(params).forEach(([k, v]) => {
        //     // @ts-ignore
        //     formDefaultValue[k] && v === formDefaultValue[k] && delete params[k];
        // });

        ['enable', 'debug'].forEach((k) => {
            // @ts-ignore
            params[k] = typeof params[k] === 'boolean' ? params[k] : params[k] === 'on';
        });
        saveData(operationKey, params);
        // operationKey = generateId();
        // formDom.reset();
    });
    formDom.addEventListener('reset', function () {
        operationKey = generateId();
        setTimeout(() => {
            // @ts-ignore
            setFormValue(formDefaultValue);
        });
    });
    delDom.addEventListener('click', function () {
        if (!window.confirm('确认删除?')) return;
        deleteData(operationKey);
        formDom.reset();
        delDom.style.display = 'none';
        operationKey = generateId();
    });

    a.appendChild(delDom);
    a.appendChild(resetDom);
    a.appendChild(submitDom);
    formDom.appendChild(a);
    contentDom.appendChild(formDom);
}

function getDom<T extends HTMLElement>(id: string): T {
    return document.getElementById(id) as T;
}
const addBtn = getDom<HTMLButtonElement>('add-btn');
const syncBtn = getDom<HTMLButtonElement>('sync-btn');
const clearBtn = getDom<HTMLInputElement>('clear-btn');
const msgBox = getDom<HTMLInputElement>('msg-content');

// 绑定事件
addBtn.onclick = () => {
    resetActiveState();
    formDom.reset();
    operationKey = generateId();
    const delDom = formDom.getElementsByClassName('del-btn')[0] as HTMLButtonElement;
    delDom && (delDom.style.display = 'none');
};
syncBtn.onclick = () => syncData(() => toast('同步成功!'));
clearBtn &&
    (clearBtn.onclick = () =>
        window.confirm('确认清空数据?') &&
        clearData(() => {
            formDom.reset();
            const delDom = formDom.getElementsByClassName('del-btn')[0] as HTMLButtonElement;
            delDom && (delDom.style.display = 'none');
            toast('数据已清空!');
        }));

/** 保存数据 */
function saveData(k: string, v: any) {
    setData(k, v, () => {
        toast('保存成功!');
    });
}
/** 删除数据 */
function removeData(k: string) {
    deleteData(k, () => {
        toast('删除成功!');
    });
}
// clearData();

let msgTimer: number;
/** 对操作进行提示 */
function toast(msg: string) {
    clearTimeout(msgTimer);
    msgBox.innerHTML = msg;
    msgTimer = setTimeout(() => {
        msgBox.innerHTML = '';
    }, 2000);
}
