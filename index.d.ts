export declare const scan: (filepath: string, only?: MatchRule, scans?: string[]) => string[];
export type GenOptions = {
    /**
     * 模版根目录, 约定
     * > tpls 要复制的文件模板, mustache 结尾的会使用 mustache 引擎渲染
     * > partials 模版片段, 常见于递归渲染使用
     */
    tplRoot: string;
    /**
     * 覆写模板目录, 结构与模版根目录要求一致
     * 要覆盖的模板根目录, 执行同名文件覆盖
     * 比如模版目录: a/b.md, a/c.js -> 覆盖目录 a/c.js
     * -> 最终输出 a/b.md, a/c.js(覆盖目录)
     */
    overRoot?: string;
    /** 输出目录, 模版+覆写目录会被按照原始结构输出到目标目录 */
    outRoot: string;
    /** 动态数据, 渲染引擎需要的 */
    data?: any;
    /** 就算文件存在也要重写进行覆盖的规则 */
    overwrite?: MatchRule;
    /**
     * mustache 模版tags
     * default ["{{", "}}"]
     **/
    tags?: [string, string];
};
export type MatchRule = RegExp | RegExp[] | string | string[] | ((s: string) => boolean);
export declare const match: (s: string, rule?: MatchRule) => boolean;
export declare const copy: (options: GenOptions) => void;
