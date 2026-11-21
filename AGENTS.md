# 全职法师阅读网站 · 项目约定

## 项目范围

单部小说《全职法师》（作者：乱）的个人静态阅读站。只做「读」：首页、目录、阅读页、书架、设置、关于。不做账号、评论、上传、写作、后台管理、多书聚合。

部署形态是 GitHub Pages 上的纯静态站点，手机与桌面浏览器直接打开，可安装为 PWA。当前状态：**M0–M3、基础 PWA、Pages 上线已完成；M4 的 StrokeText 标题与 HalftoneReveal 主图已接入，GlowCursor/OptionWheel 待做；自动化测试待补**（2026-11-21）。线上地址：<https://999888666jiang-dev.github.io/qzfs-reader/>。开工前先读本文件与 `docs/plans/plan-v1.md`。

## 技术栈

- 前端：React + Vite + JavaScript（JSX），无后端、无 SSG、无 UI 框架。样式用原生 CSS + CSS 变量，不引入 Tailwind/组件库。
- 路由：自研 hash 路由（约 60 行），不使用 React Router；理由见 `docs/decisions/decision-02-hosting-and-data.md`。
- 状态：React Context + `useReducer`；设置、进度、书签持久化在 `localStorage`，不引入状态库。
- 数据：构建期生成静态 JSON。生成器是 Python 3.12 标准库脚本，放在 `tools/`，不引入第三方依赖。
- 动效：`StrokeText`（GSAP）、`HalftoneReveal`（WebGL2）、`GlowCursor`（WebGL2）、`OptionWheel` 四个 React Bits 组件，落位与降级见 `docs/design-system.md`。
- PWA：`vite-plugin-pwa`（Workbox），只缓存应用壳与访问过的章节；全书缓存是 v1.1。
- 测试：Vitest + React Testing Library（前端单元）、Playwright（E2E）、`python -m unittest`（语料管线）。
- 部署：GitHub Actions 构建，`actions/deploy-pages` 发布 `dist/`。

**偏离基线声明**：`docs/conventions.md` 的原基线是「原生 HTML/CSS/JS + FastAPI + SQLite + 无构建」。本项目只做静态阅读站，且四个设计稿都是 React 组件，因此改为 React + Vite 构建、纯静态托管。只允许这一处偏离，不得再引入其它框架、UI 库、后端或数据库。理由与备选方案见 `docs/decisions/decision-01-frontend-stack.md`。

## 目录用途

| 路径 | 用途 |
| --- | --- |
| `docs/` | 需求、用户故事、架构、数据设计、视觉规范、部署、任务、验证、spec/plan、决策记录 |
| `src/` | React 应用源码：`pages/`、`components/`、`hooks/`、`lib/`、`styles/`、`assets/` |
| `public/data/` | 构建产物：`catalog.json`、`meta.json`、`chapters/cNNNN.json`；由 `tools/build_corpus.py` 生成 |
| `public/icons/` | PWA 图标（192/512/maskable） |
| `tools/` | 语料构建、校验、人工覆盖与单元测试；不含运行时依赖 |
| `prototype/` | 视觉确认用的静态原型（reader.html、home.html），不接真实数据 |
| `reports/` | `quality-report.json`、`manual-review.csv`；随构建更新，进 git |
| `tests/e2e/` | Playwright 端到端测试 |
| `assets/` | 设计源素材（`mofan-hero.jpg` 原始图），构建前再优化，不直接进页面 |
| `全法原本/` | 原始小说 TXT，**不提交到 git**（见 `docs/decisions/decision-02-hosting-and-data.md`），作为语料构建输入保留在本机 |
| 根目录 4 个 `.md` | 用户提供的动效设计稿，只读输入，不要改写；实现时以它们为准 |

## 开工前读什么（按顺序）

1. `docs/conventions.md` —— 继承的工程约定与偏离项
2. `docs/requirements.md` —— R-01～R-20，唯一需求来源
3. `docs/specs/spec-v1.md` —— 本版交付契约
4. `docs/plans/plan-v1.md` —— 里程碑、任务顺序、退出标准
5. `docs/architecture.md` —— 系统结构、路由、状态、性能预算
6. `docs/data-design.md` —— 语料质量事实、清洗与选版规则、JSON 契约
7. `docs/design-system.md` —— 视觉、主题、排版、动效落位与降级
8. `docs/deployment.md` —— GitHub Pages、Actions、PWA
9. 本文件
10. 需要时再读：`docs/tasks.md`、`docs/verification.md`、`docs/glossary.md`、两份 decision 记录

## 不可违反

- R-xx 编号必须贯通：需求 → 用户故事 → spec → 任务 → 测试 → 验证记录。规则变化必须同时改文档、代码、测试。
- **不伪造缺失章节的正文**。132 章原文缺失是已知事实，用占位卡片明确告知，不用 AI 补写、不静默跳过。
- 不引入后端、数据库、账号、评论、第三方统计、第三方 CDN、在线字体。页面发出的请求只能是同源静态资源。
- 不把 `全法原本/` 的原始 TXT 提交进 git；提交生成后的 `public/data/`、`tools/`、`docs/`。
- 前端代码与数据文件里不写死绝对路径、盘符、本机用户名；所有资源用相对路径或 `import.meta.env.BASE_URL`。
- 动效必须可关闭、可降级；`prefers-reduced-motion` 与 WebGL2 不可用时，阅读功能与首屏信息不受影响。
- 一次只推进一个可独立验收的小步；上一步没有验证结果，不抛下一步，不提前写多步之后的代码。
- 所有验收以真实浏览器结果为准，不以「应该能行」代替。语料数字以 `tools/build_corpus.py` 实际输出为准，本文件里的数字是 2026-11-21 的体检结果。
- C 盘与系统目录的改动遵循 `~/.dsh/AGENTS.md`：先评估风险、先备份、最小化改动、可回退；不擅自杀进程或改系统配置。

## 常用命令（脚手架完成后生效）

```powershell
npm install                 # 首次安装
npm run dev                 # 本地开发 http://127.0.0.1:5173
npm run build               # 生产构建到 dist/
npm run preview             # 预览 dist/
npm test                    # Vitest
npm run test:e2e            # Playwright（先 build）
npm run data:check          # 校验 public/data 与 catalog 一致性
python tools/build_corpus.py --input "全法原本/《全职法师》作者：乱.txt" --out public/data
python tools/validate_corpus.py --data public/data
python -m unittest discover -s tools/tests -v
```

具体命令以 `package.json`、`README.md` 实际内容为准；命令不存在时先补脚本，不要口头假设。

## 完成定义（Definition of Done）

- R-01～R-20 全部有对应实现或明确的「未实现」记录，验收结果写入 `docs/verification.md`。
- `npm run build` 成功；`npm test`、`npm run test:e2e`、`python -m unittest` 全部通过（或列明未通过项与原因）。
- 手机 360×800、390×844 与桌面 1440×900 实测无横向滚动、无遮挡、主题切换无闪白。
- GitHub Pages 线上 URL 可打开首页、阅读页、深链刷新、书签与进度读回；刷新后状态不丢。
- README 四段齐全：安装、运行、测试、访问地址；另附语料重建与部署说明。
- 未实现项与待确认项单列，不藏在正文里；不擅自扩大范围。

## 新聊天的工作协议

1. 先确认当前目录是 `E:\全职法师阅读网站`，确认不是别的项目。
2. 按上面的「开工前读什么」顺序读，读完先复述：目标、非目标、当前里程碑、下一步、两个关键假设。
3. 只读写本项目目录；要跨目录或改 `全法原本/`、根目录设计稿、C 盘文件，先说明并取得同意。
4. 动手前声明要改哪些文件；不重写没被要求改的部分；不擅自换栈、换数据格式、改 R 规则。
5. 不确定的运行时、版本、API 先查再写，不猜；命令失败先看真实报错，不重复叠加改动。
6. 每次交付附：改了哪些文件、跑了什么命令、结果数字、未完成项、下一步建议。
