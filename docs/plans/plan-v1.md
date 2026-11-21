# v1 实施计划（plan）

> 状态：待用户确认
> 目标：按 M0 → M5 顺序交付 `docs/specs/spec-v1.md`；每一步可独立验收，上一步未验收不进入下一步。
> 规则：`docs/requirements.md` R-01～R-20；数据：`docs/data-design.md`；视觉：`docs/design-system.md`；部署：`docs/deployment.md`。

## 1. 技术方案摘要

- **前端**：React + Vite + JSX；原生 CSS 变量；自研 hash 路由；Context + `useReducer`。
- **数据**：构建期静态 JSON；`fetch` 按需加载；内存 LRU + 预取下一章；Service Worker 缓存访问过的章节。
- **动效**：React Bits 四组件；首页懒加载 GSAP/WebGL；阅读页只加载轻量轮盘，不加载 GSAP/WebGL；`EffectBoundary` + 降级。
- **持久化**：`localStorage` 三键；schema 版本 + 校验 + 备份；导出/导入 JSON。
- **测试**：Python unittest（管线）→ Vitest/RTL（纯逻辑与组件）→ Playwright（真实浏览器/移动视口/深链/离线）。
- **部署**：GitHub Actions → Pages；`base: './'`；hash 路由；PWA `prompt` 更新。

## 2. 依赖清单

| 依赖 | 用途 | 备注 |
| --- | --- | --- |
| `react`、`react-dom` | UI | 用 npm 当前稳定版，锁进 lockfile |
| `gsap` | StrokeText 时间线 | 只被首页 chunk 引用；不全局注册 |
| `vite`、`@vitejs/plugin-react` | 构建 | Node 24 |
| `vite-plugin-pwa` | manifest + SW | `registerType: 'prompt'` |
| `vitest`、`jsdom`、`@testing-library/react`、`@testing-library/jest-dom` | 单测 | devDependencies |
| `@playwright/test` | E2E | devDependencies；只装 Chromium 起步 |

**不引入**：React Router、Redux/Zustand、Tailwind、UI 组件库、图标库、动画库（GSAP 除外）、在线字体、CDN、后端 SDK。
版本策略：初始化时用 `npm view <pkg> version` 查稳定版再安装；禁止手写猜测版本；`package-lock.json` 入库。

## 3. 里程碑与退出标准

### M0 工程基线（预计 0.5 天）

**步骤**

1. 建目录：`src/{pages,components,hooks,lib,styles,assets}`、`public/{data,icons}`、`tools/tests`、`tests/e2e`。
2. `package.json` + `vite.config.js`（`base: './'`，先不接 PWA）；`index.html`（内联主题脚本、`noindex`）。
3. 最小 `App`：显示「全职法师 · 阅读站」与当前 hash；`npm run dev` 可开。
4. `.gitignore`、`.github/workflows/deploy.yml`（先只 build，不 deploy）；`README.md` 骨架。
5. CI 干跑：`npm ci && npm run build` 通过。

**退出标准**

- `npm run dev` 打开 200；`npm run build` 成功；`dist/index.html` 存在。
- `git status` 看不到 `全法原本/`、`node_modules/`、`dist/`。
- 空壳 CI 构建成功；真正的 Pages 部署留到 M5（如用户已确认仓库，可提前跑一次验证子路径）。

**验收**：R-14（路由骨架）、R-16（子路径）、R-20（noindex）。

### M1 语料管线（预计 1–2 天）

**步骤**

1. `tools/build_corpus.py`：解码/换行/候选标题/伪标题剔除/正文切片。
2. 清洗：BOM、零宽、段首空格、广告行/后缀、页码、标题公告。
3. 选版评分 + `overrides.json` + `needsManual` 标记。
4. 1–3,233 排序、缺失占位、标题兜底。
5. 输出 `meta.json`、`catalog.json`、`chapters/*.json`、`reports/quality-report.json`、`reports/manual-review.csv`。
6. `tools/validate_corpus.py` + `tools/tests/`（合成样本：正常、重复、缺失、广告、BOM、标题空、覆盖失效）。
7. 用真实原文跑一次，核对基线：3,233 / 3,101 / 132；抽样 30 章读一遍。

**退出标准**

- 一条命令生成全部数据；校验全过；报告数字与 `docs/data-design.md` 基线一致（允许选版细分差异，但总数不变）。
- 55 组标题冲突有 CSV 清单；前 10 组人工确认并写入 overrides 或标注「保留自动选择」。
- 随机 20 章无广告、无 BOM、正文可读；缺失章 JSON 为占位。

**验收**：R-17、R-02（缺失数据侧）。

### M2 骨架与视觉原型（预计 1–2 天）

**步骤**

1. `prototype/reader.html`：单文件静态原型，含顶栏、正文、底栏、设置抽屉、六主题切换、字号滑杆；用假数据 3 段；在 360/390/768/1024/1440 截图确认。
2. 用户确认原型后，再写正式页面结构。
3. `src/lib/dataClient.js`：加载 catalog/meta、章节、LRU、错误。
4. hash 路由 + 六个页面壳；`ChapterList` 虚拟列表（3,233 项）；首页/阅读页骨架。
5. 基础 CSS tokens/主题/排版变量；首屏主题脚本联调。

**退出标准**

- 原型可在手机尺寸下完整操作（主题、字号、目录、翻章假数据）。
- 正式应用：首页、`#/read/c0001`、目录、404 可打开；catalog 3,233 条渲染不卡。
- 五档视口无横向滚动；首帧无闪白。

**验收**：R-01、R-02（正常章）、R-06（目录）、R-13（布局）、R-14。

### M3 阅读核心（预计 2–3 天）

**步骤**

1. 阅读页：正文段落、标题、上下章、进度条、缺失提示、错误卡。
2. 设置：六主题、字号 14–32、字体、行距、段距、页宽、对齐、恢复默认；设置抽屉 + `#/settings` 共用。
3. 进度：滚动比例、节流保存、恢复、最近 50 章位置。
4. 书签 + 书架 + 最近阅读。
5. 目录：分组、过滤、当前/已读/书签/缺失标记、跳转。
6. 搜索：章节号/标题、防抖、高亮、空状态、200 条上限。
7. 持久化：schema 校验、损坏回退、导出/导入、清空。
8. 键盘：←/→、↑/↓、Esc；移动端滑动翻章（阈值 60 px）。

**退出标准**

- R-02～R-11 的验收场景全部手工通过；单元测试覆盖存储损坏、进度恢复、边界章、搜索过滤。
- 360/390/768/1024/1440 五档阅读页无溢出；32 px 字号不横向滚动。
- 刷新后字号/主题/进度/书签全部读回。

**验收**：R-02～R-11、R-13、R-14、R-19（键盘基础）。

### M4 体验与动效（预计 3–4 天）

**步骤**

1. 引入四个组件到 `src/components/effects/`；保留原 props 语义与注释；包 `EffectBoundary`。
2. 首页：StrokeText 标题 + HalftoneReveal 主图 + GlowCursor 背景；`React.lazy` + idle 挂载；主图多尺寸。
3. 阅读页：OptionWheel 浮层（窗口 ±20 章）、快捷键 `C`、`Esc`、焦点陷阱。
4. 动效设置与自动降级：reduced-motion、WebGL2 检测、触摸/低端判定、页面隐藏暂停。
5. 响应式细节、移动端工具栏、安全区、触控目标、焦点样式、`aria-live`。
6. 性能：代码分割、图片优化、长任务、目录滚动、Lighthouse。

**退出标准**

- 首页三种动效在桌面正常，移动端自动简化；关闭开关后立即静态。
- 模拟 reduced-motion / 无 WebGL / 触摸设备，三种降级均可用，无控制台报错。
- 轮盘可选择并跳章；`Esc` 关闭；不影响上下章按钮。
- Lighthouse 移动：Performance ≥80，Accessibility ≥95；预算项达标。

**验收**：R-07、R-12、R-13、R-18、R-19。

### M5 上线（预计 1–2 天）

**步骤**

1. PWA：manifest、三套图标、SW（`prompt`）、更新提示、离线提示。
2. Playwright：首页、阅读、设置持久化、深链、缺失章、移动端、离线（至少 6 条）。首次运行前 `npx playwright install chromium`。
3. 真机验收：iOS Safari + Android Chrome 各一台；飞行模式；安装主屏。
4. Pages：Actions deploy、URL 验证、404 检查、`data:check`。
5. README 四段 + 语料重建 + 部署说明；`docs/verification.md` 写真实结果。
6. 打 tag `v1.0.0`；记录回滚点。

**退出标准**

- 线上 URL 手机可读；深链刷新正常；PWA 可安装；离线已读章可开。
- 所有测试通过；验证记录完整；README 四段齐全。
- 默认/最小/最大设置组合真机验证通过。

**验收**：R-15～R-20。

## 4. 建议提交粒度

| 提交 | 内容 |
| --- | --- |
| `chore: scaffold vite react app` | M0 脚手架 |
| `feat(data): corpus pipeline and validation` | M1 |
| `feat(ui): reader prototype and app shell` | M2 |
| `feat(reader): typography, themes and settings` | M3 第一段 |
| `feat(reader): progress, bookmarks and search` | M3 第二段 |
| `feat(home): hero effects and chapter wheel` | M4 |
| `feat(pwa): offline shell and update prompt` | M5 |
| `docs: verification and release notes` | M5 |

一次提交只做一件事；不混入无关格式化；不提交 `dist/`、`node_modules/`。

## 5. 测试策略

| 层 | 工具 | 覆盖 |
| --- | --- | --- |
| 语料 | Python unittest | 标题解析、伪标题、清洗、选版、缺失、覆盖失效、校验失败 |
| 纯逻辑 | Vitest | 存储 schema/损坏回退、进度比例、章节边界、搜索规范化、导出/导入 |
| 组件 | RTL | 设置面板、目录行状态、缺失提示、Toast、抽屉焦点 |
| E2E | Playwright | 首页→阅读→设置→刷新→翻章→目录→书签→深链→缺失→移动端→离线 |
| 手工 | 真机 | iOS Safari、Android Chrome、飞行模式、安装 PWA、字体/主题边界 |

E2E 先跑 `npm run build && npm run preview`，以真实 `dist/` 为准，不用 dev server 代替。

## 6. 风险与应对

| 风险 | 触发 | 应对 |
| --- | --- | --- |
| 原文选版出错 | 55 组冲突 | M1 输出 CSV；上线前人工抽查；overrides 可回滚 |
| 动效组件在 Vite 下不兼容 | 首跑 | 先单独最小页面验证一个组件，再批量接入；不一次性全上 |
| 移动端 WebGL 掉帧 | 真机 | 默认关光标/半调；`quality` 降级；EffectBoundary |
| Pages 子路径 404 | 首次部署 | `base: './'`；Network 检查；不用绝对路径 |
| 数据体积超预算 | catalog/章节 | 只加载当前章；预取 1 章；不预加载全书 |
| SW 缓存旧内容 | 更新后 | `prompt` + `meta.builtAt`；NetworkFirst；提示刷新 |
| 规则漂移 | 开发中改需求 | 先改 requirements/spec/tasks，再改代码；R 编号不变 |

## 7. 时间估算（单人，按晚上/周末）

| 阶段 | 估时 | 备注 |
| --- | --- | --- |
| M0 | 0.5 天 | 脚手架 + CI 空跑 |
| M1 | 1–2 天 | 规则多，测试要细 |
| M2 | 1–2 天 | 原型确认占一半 |
| M3 | 2–3 天 | 核心功能，测试密集 |
| M4 | 3–4 天 | 四组件接入 + 降级 + 性能 |
| M5 | 1–2 天 | PWA、E2E、真机、上线 |
| **合计** | **9–13 天** | 不含补章与内容校对 |

## 8. 下个工作区的第一步

1. 读 `AGENTS.md` + 本文档 + `docs/architecture.md`；复述目标/非目标/当前 M0。
2. 问用户两个问题：仓库公开/私有；132 章先占位还是等补全。
3. 执行 M0：先只做脚手架 + 空壳构建，不写阅读功能；跑通后停下等验收。
4. 每个里程碑结束：附命令、结果、截图/URL、未完成项，再进入下一个。

## 9. 明确不做（防止范围蔓延）

- 不因为「顺手」加全文搜索、云同步、评论、统计。
- 不在 M1 之前写阅读页；不在 M3 之前接动效。
- 不为动效牺牲首章可读性；不为视觉改数据格式。
- 不把 `全法原本/` 或 `dist/` 提交；不把绝对路径写进代码。
