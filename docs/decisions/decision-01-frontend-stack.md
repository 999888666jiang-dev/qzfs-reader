# ADR-01：前端栈选择（React + Vite）

- 状态：提议（待用户确认）
- 日期：2026-11-21
- 相关：`docs/conventions.md` X-01、`docs/architecture.md` §3

## 背景

主设计会话的工程基线是「原生 HTML/CSS/JS、单文件内联、无构建、无框架、无 npm 依赖」。本项目有两处不同：

1. 用户要求发布到 GitHub Pages，随时随地用手机打开，需要构建产物、PWA、子路径适配。
2. 用户提供的四份视觉稿不是静态图，而是 React Bits 组件源码：
   - `StrokeText`：React + GSAP + SVG，约 500 行；
   - `HalftoneReveal`：React + WebGL2，约 900 行；
   - `GlowCursor`：React + WebGL2 流体模拟，约 1,000 行；
   - `OptionWheel`：React + rAF，约 430 行。

## 选项

### A. React + Vite（选中）

- 直接接入四个组件，保留原 props 与动画参数；Vite 负责打包、代码分割、PWA。
- 仍输出纯静态 `dist/`，GitHub Pages 可托管；无运行时框架服务端。
- 代价：需要 Node 构建、CI、依赖锁文件；首包多 React 运行时（约 45 KB gzip）。

### B. 原生 HTML/CSS/JS + 手写等价实现

- 符合原基线，零构建，Pages 直接托管源码。
- 但要把四个 React/WebGL 组件翻译成原生类或函数：约 2,000+ 行，涉及 shader、GSAP 时间线、焦点管理；任何一处偏差都会让视觉与设计稿不一致。
- 风险：高；维护成本高；后续调整动效参数要同时改两套心智模型。

### C. Next.js / Astro 等 SSG

- 能做静态导出与更好的首屏 HTML，但对单书阅读站是过度设计：路由、数据、PWA 都能用更小的方案解决。
- 增加构建复杂度与框架锁定，且组件仍需客户端水合。

## 比较

| 维度 | A React+Vite | B 原生 | C SSG |
| --- | --- | --- | --- |
| 视觉保真度 | 高（直接用稿） | 中（需翻译） | 高 |
| 实现风险 | 中 | 高 | 中高 |
| 构建复杂度 | 中（Vite） | 低 | 高 |
| 运行时体积 | 中（React 45 KB） | 低 | 中 |
| 维护成本 | 低 | 高 | 中 |
| 与基线一致性 | 偏离（已声明） | 一致 | 偏离更大 |
| 静态托管 | 是 | 是 | 是 |

## 决定

选 **A：React + Vite + JSX**。只允许这一处栈偏离；不引入 React Router、状态库、UI 库、Tailwind、在线字体、CDN。

## 后果

- 必须锁 `package-lock.json`；Node 24；CI 用 `npm ci`。
- 阅读页与首页做路由级代码分割：GSAP/WebGL 只在首页 chunk，阅读页不加载。
- 无 JS 时页面不可读：提供 `<noscript>` 提示「请启用 JavaScript」；这是纯前端阅读站的已知限制，不在 v1 解决 SSR。
- 动效组件保留 `'use client'` 指令也无害（Vite 忽略）；不要为此改成 Next。
- 基线中「单文件内联」不再适用；CSS 仍用原生变量与模块化文件，不引入 CSS-in-JS。

## 何时重审

- 用户明确要求零构建、可接受动效降级为静态 → 切 B，重写四个组件并重估 3–5 天。
- 四组件被替换为纯 CSS 动效 → A 的收益下降，可重新评估。
- 首包/性能无法达标且无法通过分割解决 → 评估 Preact 或移除部分动效，而不是换框架。

## 与用户确认的问题

1. 接受 GitHub Actions 构建（每次 push 自动打包）吗？
2. 接受阅读站依赖 JavaScript 吗？（纯静态 HTML 预渲染不在 v1 范围）

> 默认按「接受」推进；用户否决时改用 B，并在 `docs/plans/plan-v1.md` 增加 3–5 天与降级说明。
