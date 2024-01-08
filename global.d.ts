/** 接口替换的配置项 */
declare interface MatchRuleOption {
    /** 接口名称 */
    name: string;
    /** 匹配路径的正则 */
    reg: RegExp | string;
    /** 返回替换的路径 */
    replacer?: string | ((str: string, reg: RegExp) => string);
    /** 处理请求头 */
    reqHandler?: (request: RequestInit | XMLHttpRequest) => void;
    /** 处理返回值 */
    resHandler?: (response: Response | XMLHttpRequest) => void;
    /** 分组名 */
    group?: string;
    /** 排序 */
    sort?: number;
    /** 该规则是否启用 */
    enable?: boolean;
    /** 是否在匹配规则时开启断点 */
    debug?: boolean;
    /** 仅在匹配中后开启断点 */
    debugAtMatching?: boolean;
}
