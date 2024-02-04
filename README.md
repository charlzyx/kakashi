# Kakashi 卡卡西

> 你知道我要说什么

```bash
bun i @achaogpt/kakashi
```

根据约定, 使用 mustache 渲染指定文件夹里的模版文件到输出目录

## 约定

- 模版根目录, 下级子目录约定
- > tpls 要复制的文件模板, mustache 结尾的会使用 mustache 引擎渲染
- > partials 模版片段, 常见于递归渲染使用

## options

```tsx
type CopyOptions {
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
}

export type MatchRule =
  | RegExp
  | RegExp[]
  | string
  | string[]
  | ((s: string) => boolean);

```

## Usage

```tsx
import path from "path";
import { copy } from "../index";

copy({
  tplRoot: path.resolve(__dirname, "./templates"),
  data: {
    routeImports: [
      {
        import: "import Skeleton from '@ant-design/pro-skeleton';",
      },
      {
        import: "import React from 'react';",
      },
      {
        import: "const Home = React.lazy(() => import('../pages/home'));",
      },
      {
        import: "const Login = React.lazy(() => import('../pages/login'));",
      },
      {
        import: "const Index = React.lazy(() => import('../pages/index'));",
      },
      {
        import: "const Admin = React.lazy(() => import('../pages/admin'));",
      },
      {
        import:
          "const AdminDashboard = React.lazy(() => import('../pages/admin/dashboard'));",
      },
    ],
    rootRoute: [
      {
        element: "Home",
        name: "Home",
        path: "/home",
        component: "../pages/home",
        routes: null,
      },
      {
        element: "Login",
        name: "Login",
        path: "/login",
        component: "../pages/login",
        routes: null,
      },
      {
        element: "Index",
        name: "Index",
        path: "/index",
        component: "../pages/index",
        routes: null,
      },
      {
        element: "Admin",
        name: "Admin",
        path: "/admin",
        component: "../pages/admin",
        routes: [
          {
            element: "AdminDashboard",
            name: "Dashboard",
            path: "dashboard",
            component: "../pages/admin/dashboard",
            routes: null,
          },
        ],
      },
    ],
  },
  outRoot: path.resolve(__dirname, "./output"),
  tags: ["[[", "]]"],
});
```

## Examples

```bash
example
├── index.ts
├── output
│   └── app
│       ├── README.md
│       ├── index.tsx
│       ├── layout.tsx
│       ├── request.tsx
│       └── routes.tsx
├── overwrite
│   ├── partials
│   │   └── RecurseLazyRouters.mustache
│   └── tpls
│       └── app
│           ├── README.md
│           └── request.tsx.mustache
└── templates
    ├── partials
    │   ├── README.md
    │   ├── RecurseLazyRouters.mustache
    │   └── RecurseRoutes.mustache
    └── tpls
        └── app
            ├── README.md
            ├── index.tsx.mustache
            ├── layout.tsx.mustache
            ├── request.tsx.mustache
            └── routes.tsx.mustache
```
