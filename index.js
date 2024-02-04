"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.copy = exports.match = exports.scan = void 0;
const mustache_1 = __importDefault(require("mustache"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const scan = (filepath, only, scans = []) => {
    if (!fs.existsSync(filepath)) {
        console.warn(`${filepath} no exists, skip scan.`);
        return scans;
    }
    else if (fs.statSync(filepath).isDirectory()) {
        fs.readdirSync(filepath).forEach((sub) => {
            (0, exports.scan)(path.join(filepath, sub), only, scans);
        });
    }
    else {
        const catchYou = only ? (0, exports.match)(filepath, only) : true;
        if (catchYou) {
            scans.push(filepath);
        }
    }
    return scans;
};
exports.scan = scan;
const match = (s, rule) => {
    if (typeof rule === "function") {
        return rule(s);
    }
    else if (Array.isArray(rule)) {
        return Boolean(rule.find((r) => (0, exports.match)(s, r)));
    }
    else if (typeof rule === "string") {
        return s === rule;
    }
    else if (rule) {
        return rule === null || rule === void 0 ? void 0 : rule.test(s);
    }
    else {
        return false;
    }
};
exports.match = match;
const copy = (options) => {
    const { tplRoot: cwd, overRoot, outRoot, data } = options;
    const tplRoot = path.resolve(cwd, "tpls");
    const overTplRoot = overRoot ? path.resolve(overRoot, "tpls") : null;
    const partialRoot = path.resolve(cwd, "partials");
    const overPartialRoot = overRoot ? path.resolve(overRoot, "partials") : null;
    const tplFiles = (0, exports.scan)(tplRoot);
    const partialsFiles = partialRoot ? (0, exports.scan)(partialRoot) : [];
    const partials = partialsFiles.reduce((map, filepath) => {
        // partials 不复制其他文件
        if (!/\.mustache$/.test(filepath)) {
            return map;
        }
        const key = filepath
            .replace(`${path.dirname(filepath)}/`, "")
            .replace(".mustache", "");
        const partialFilePath = overPartialRoot &&
            fs.existsSync(filepath.replace(partialRoot, overPartialRoot))
            ? filepath.replace(partialRoot, overPartialRoot)
            : filepath;
        map[key] = fs.readFileSync(partialFilePath).toString();
        return map;
    }, {});
    tplFiles.forEach((filepath) => {
        const to = filepath.replace(tplRoot, outRoot).replace(/\.mustache$/, "");
        const canOverwrite = !fs.existsSync(to) || (0, exports.match)(to, options.overwrite);
        if (!canOverwrite)
            return;
        const tplFilePath = overTplRoot && fs.existsSync(filepath.replace(tplRoot, overTplRoot))
            ? filepath.replace(tplRoot, overTplRoot)
            : filepath;
        const content = fs.readFileSync(tplFilePath).toString();
        if (options.tags) {
            mustache_1.default.tags = options.tags;
        }
        try {
            // 不是模版就不渲染了, 直接cv
            const output = /!\.mustache$/.test(filepath)
                ? content
                : mustache_1.default.render(content, data, partials);
            const dir = path.dirname(to);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            fs.writeFileSync(to, output);
        }
        catch (error) {
            console.error(`Kakashi Copy Files Error on ${to}, case by`, error);
            throw error;
        }
    });
};
exports.copy = copy;
