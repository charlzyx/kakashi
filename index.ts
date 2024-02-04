import mustache from "mustache";
import * as fs from "fs";
import * as path from "path";

export const scan = (
  filepath: string,
  only?: MatchRule,
  scans: string[] = [],
) => {
  if (!fs.existsSync(filepath)) {
    console.warn(`${filepath} no exists, skip scan.`);
    return scans;
  } else if (fs.statSync(filepath).isDirectory()) {
    fs.readdirSync(filepath).forEach((sub) => {
      scan(path.join(filepath, sub), only, scans);
    });
  } else {
    const catchYou = only ? match(filepath, only) : true;
    if (catchYou) {
      scans.push(filepath);
    }
  }
  return scans;
};

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

export type MatchRule =
  | RegExp
  | RegExp[]
  | string
  | string[]
  | ((s: string) => boolean);

export const match = (s: string, rule?: MatchRule): boolean => {
  if (typeof rule === "function") {
    return rule(s);
  } else if (Array.isArray(rule)) {
    return Boolean(rule.find((r) => match(s, r)));
  } else if (typeof rule === "string") {
    return s === rule;
  } else if (rule) {
    return rule?.test(s);
  } else {
    return false;
  }
};

export const copy = (options: GenOptions) => {
  const { tplRoot: cwd, overRoot, outRoot, data } = options;
  const tplRoot = path.resolve(cwd, "tpls");
  const overTplRoot = overRoot ? path.resolve(overRoot, "tpls") : null;
  const partialRoot = path.resolve(cwd, "partials");
  const overPartialRoot = overRoot ? path.resolve(overRoot, "partials") : null;

  const tplFiles = scan(tplRoot);
  const partialsFiles = partialRoot ? scan(partialRoot) : [];

  const partials = partialsFiles.reduce<Record<string, string>>(
    (map, filepath) => {
      // partials 不复制其他文件
      if (!/\.mustache$/.test(filepath)) {
        return map;
      }
      const key = filepath
        .replace(`${path.dirname(filepath)}/`, "")
        .replace(".mustache", "");

      const partialFilePath =
        overPartialRoot &&
        fs.existsSync(filepath.replace(partialRoot, overPartialRoot))
          ? filepath.replace(partialRoot, overPartialRoot)
          : filepath;

      map[key] = fs.readFileSync(partialFilePath).toString();
      return map;
    },
    {},
  );

  tplFiles.forEach((filepath) => {
    const to = filepath.replace(tplRoot, outRoot).replace(/\.mustache$/, "");
    const canOverwrite = !fs.existsSync(to) || match(to, options.overwrite);
    if (!canOverwrite) return;

    const tplFilePath =
      overTplRoot && fs.existsSync(filepath.replace(tplRoot, overTplRoot))
        ? filepath.replace(tplRoot, overTplRoot)
        : filepath;

    const content = fs.readFileSync(tplFilePath).toString();
    if (options.tags) {
      mustache.tags = options.tags;
    }
    try {
      // 不是模版就不渲染了, 直接cv
      const output = /!\.mustache$/.test(filepath)
        ? content
        : mustache.render(content, data, partials);
      const dir = path.dirname(to);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(to, output);
    } catch (error) {
      console.error(`Kakashi Copy Files Error on ${to}, case by`, error);
      throw error;
    }
  });
};
