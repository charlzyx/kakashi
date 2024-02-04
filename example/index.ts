import path from "path";
import { copy } from "../index";

copy({
  tplRoot: path.resolve(__dirname, "./templates"),
  overRoot: path.resolve(__dirname, "./overwrite"),
  overwrite: /routes/,
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
