# 全职法师阅读网站 · 架构设计 v1

> 状态：待用户确认（2026-11-21）
> 依据：`docs/conventions.md`（主设计会话基线）、4 份动效设计稿、原文体检结果、已验证环境。
> 本文回答「做成什么样、为什么这样、怎么拆、风险在哪」；具体规则见 `docs/requirements.md`，数据细节见 `docs/data-design.md`，视觉与动效见 `docs/design-system.md`。

## 0. 一页结论

做一个**纯静态、单书、移动优先**的阅读站：React + Vite 构建，构建期把 33 MB 原始 TXT 清洗成 `catalog.json` + 3,233 个章节 JSON（含 132 个占位），部署到 GitHub Pages；数据只读，进度/书签/设置存本机 `localStorage`；四个 React Bits 动效（描边标题、半调显影主图、光斑光标、章节轮盘）按「首页优先、阅读页默认不加载」接入，全部可关闭、可降级。

三个必须先接受的事实：

1. **原文不完整**：3,233 章中 132 章缺失，其中 2,893–2,992 连续缺 100 章。v1 用「原文缺失」占位卡，不补写、不改号；补章是内容任务，不是代码任务。
2. **原文本是拼接稿**：4,494 个标题候选、1,356 组重复编号、至少两轮抓取版本、6,696 处 `⚹` 脱敏占位、若干站点广告。必须走构建管线选版清洗，不能直接按标题切分上线。
3. **不是零构建**：四份设计稿都是 React + WebGL/GSAP 组件，手写原生等价实现风险高、保真度不可控。因此本项目偏离「无框架、无构建」基线，改用 React + Vite；这是 ADR-01 的唯一重大偏离。

## 1. 目标与非目标

### 目标

- 打开就能读：手机/桌面/平板，首章 2.5 秒内可读，阅读页无广告、无干扰。
- 舒适阅读：字号、主题、字体、行距、段距、页宽可调，刷新与重开保持。
- 找章快：3,233 章目录、编号/标题搜索、上一章/下一章、键盘/手势/轮盘切换、书签与继续阅读。
- 有记忆：进度（章 + 章内位置）、书签、最近阅读本机持久化，可导出/导入。
- 有辨识度：首页描边标题 + 莫凡半调显影 + 光斑光标；章节切换轮盘；但动效永远不挡阅读。
- 可发布：GitHub Actions 自动部署到 Pages，子路径可用，可安装 PWA，访问过的章节可离线。
- 可维护：规则编号贯通，语料可重建，质量报告可追溯，单步可验收。

### 非目标（v1 明确不做）

- 用户账号、云同步、评论、点赞、阅读排行、广告、付费。
- 后端 API、数据库、服务端渲染、多书聚合、书源抓取。
- 全文搜索（v1 只搜章节号/标题；全文索引列入 v1.1 评估）。
- 全书离线下载（v1 只缓存访问过的章节；全书缓存列 v1.1）。
- 分页翻页模式（v1 滚动阅读；「仿真翻页」列 v1.2）。
- 自动补全缺失章节、AI 续写、自动改错别字。
- 桌面客户端/微信小程序/App。

## 2. 输入与事实

### 2.1 素材清单

| 素材 | 位置 | 用途 | 处理 |
| --- | --- | --- | --- |
| 原文 TXT | `全法原本/《全职法师》作者：乱.txt`（32,923,808 B） | 语料唯一来源 | 构建期读取；**不进 git** |
| 首页标题动效 | `全职法师标题.md`（StrokeText） | 首页书名 | 作为 React 组件接入 |
| 首页主图动效 | `首页莫凡形象设计.md`（HalftoneReveal） | 首页莫凡主图 | 接入 + 静态兜底 |
| 章节切换 | `章节切换设计.md`（OptionWheel） | 章节快速切换浮层 | 接入 + 窗口化数据 |
| 光标动效 | `光标动效.md`（GlowCursor） | 首页光标光斑 | 仅桌面首页 |
| 主图 | `assets/mofan-hero.jpg`（1952×1172，869,725 B） | 首页视觉 | 构建前压成 WebP/多尺寸 |
| 基线约定 | `E:\流程架构设计\docs\conventions.md` | 工程纪律 | 继承 + 4 项偏离 |

### 2.2 原文体检（2026-11-21，脚本实测）

| 指标 | 结果 | 含义 |
| --- | --- | --- |
| 字符数 / 行数 | 11,169,407 / 249,636 | UTF-8 无 BOM、LF、段首全角缩进 |
| 标题候选 | 4,494 个「第 N 章」 | 含 14 个缩进标题（13 个伪标题/空壳 + 1 个仅缩进出现的正常章 1,523） |
| 编号范围 | 1–3,233 | 原著章节总数按 3,233 处理 |
| 唯一编号 | 3,101 | 可提供正文的章节 |
| 缺失 | 132 章 | 2,893–2,992 连续 100 章；957–966 缺 9；1,863–1,866 缺 4；其余 19 分散 |
| 重复编号 | 1,356 组 | 至少两轮抓取拼接；同一章有 2–4 个版本 |
| 标题冲突 | 55 组 | 列首标题；清洗后 38 组、归一化后 36 组；其中 33 组需人工复核 |
| 内容差异大 | 约 24 组（相似度 <0.9） | 需人工裁定，不能自动合并 |
| 候选总字数 | 10,382,187 | 含重复版本 |
| 选版后字数 | 7,101,261 | 实际构建结果（清洗后） |
| `⚹` 脱敏占位 | 6,696 处（U+26B9） | 两轮版本中前一轮 5,392、后一轮 1,304；选版后正文保留 1,228 处 |
| BOM / 零宽 | U+FEFF 194 处 | 已清 |
| 站点广告 | 笔趣阁 79、请记住 30、百度搜索 12、最新章节 6、小-说-网 7 等 | 构建时清掉 198 行 |
| 空标题 | 39 个空标题候选 | 选版后 8 章用「第 N 章」兜底 |
| 异常短章 | 14 个候选正文 <500 字 | 选版后最短 1,073 字，无短章 |

**结论**：数据质量是本项目第一风险。架构必须把「解析 → 清洗 → 选版 → 排序 → 补占位 → 校验 → 报告」做成可重复的管线，并允许人工覆盖；不能把清洗逻辑散落在页面里。

### 2.3 环境事实

Python 3.12.7、Node 24.16.0、npm 11.13.0、git 2.54.0、gh 2.97.0；无 uv。构建与运行不依赖外网（npm 安装除外）。当前主图为用户微信临时目录中的文件，已复制到 `assets/`。

## 3. 关键决策

| 编号 | 决策 | 选择 | 理由（一句话） | 备选与否决原因 |
| --- | --- | --- | --- | --- |
| D-01 | 前端栈 | React + Vite + JSX，原生 CSS | 四份设计稿是 React 组件，直接接入风险最低 | 原生 JS 需手写 2,000+ 行 WebGL/GSAP，保真度不可控（ADR-01） |
| D-02 | 数据形态 | 构建期静态 JSON，一章一文件 | 静态托管无服务端；按需加载、可缓存、可离线 | 单文件 7 MB 首屏不可接受；SQLite WASM 增加复杂度 |
| D-03 | 路由 | 自研 hash 路由 | Pages 无重写，hash 深链无需 404 hack | React Router 多一个依赖；history 路由需 404.html 兜底 |
| D-04 | 持久化 | `localStorage`，三键三 schema | 无账号需求；实现与测试都简单 | IndexedDB 过度；云同步需后端 |
| D-05 | 托管 | GitHub Pages + Actions | 用户明确要求；免费、HTTPS、可绑域名 | Vercel/Cloudflare 更快但偏离用户要求，仅作备选 |
| D-06 | 动效 | 首页重、阅读页轻，渐进增强 | 动效不能挡读；移动端 WebGL 耗电 | 全站常驻光标会干扰阅读且耗电 |
| D-07 | 语料 | 自动选版 + `overrides.json` 人工覆盖 + 缺失占位 | 55 组冲突与 132 章缺口必须可控可追溯 | 全自动会静默错章；全人工不可维护 |
| D-08 | 搜索 | v1 章节号/标题；全文 v1.1 评估 | 7.1M 字全文索引体积与首屏预算冲突 | 直接上全文会让首包不可控 |
| D-09 | PWA | 应用壳 + 访问过的章节离线 | 满足「随时随地」且不强迫下载全书 | 全书约 22 MB 缓存需用户显式触发，v1.1 |
| D-10 | 仓库 | 原文不进 git；提交生成语料 + 工具 + 质量报告 | 避免 33 MB 源文件与 22 MB 生成物双份；Pages 只需生成物 | Git LFS 增加使用门槛；Release 附件留作 CI 重建备选 |

> 编号说明：`D-xx` 是本文的技术决策编号；`X-01～X-04` 是 `docs/conventions.md` 的基线偏离编号。两套编号不通用，引用时写清前缀。

## 4. 系统架构

### 4.1 运行时拓扑

```text
┌──────────────────────── 构建期（本机 / GitHub Actions） ────────────────────────┐
│ 全法原本/*.txt ──build_corpus.py──> public/data/{meta,catalog,chapters/*}.json  │
│                     │                                                          │
│                     └──> reports/quality-report.json + manual-review.csv        │
│ Vite build（src + public）──> dist/（index.html, assets/*, data/*, sw.js）        │
└───────────────────────────────────┬────────────────────────────────────────────┘
                                    │ GitHub Actions → Pages
                                    ▼
┌──────────────────────── 运行期（浏览器，纯静态） ──────────────────────────────┐
│ index.html（内联主题脚本）→ React SPA（hash 路由）                               │
│   ├─ 首页 /       （标题描边、半调主图、光斑光标，懒加载）                        │
│   ├─ 阅读 /read/:id（目录、排版、主题、进度、书签；不加载 GSAP/WebGL）            │
│   ├─ 书架 /shelf   （书签 + 最近阅读 + 导出/导入）                                │
│   ├─ 搜索 /search  （章节号/标题）                                               │
│   ├─ 设置 /settings（全量设置）                                                  │
│   └─ 关于 /about   （文本来源、缺失说明、版权、版本）                             │
│ 数据层：catalog（内存）→ chapter（LRU 缓存 + 预取下一章）                         │
│ 持久层：localStorage（settings/progress/bookmarks）                              │
│ 离线层：Service Worker（应用壳 + 访问过的 data JSON）                             │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 4.2 数据流

1. 构建：原文 → 候选标题 → 清洗 → 选版 → 1–3,233 排序 → 缺失占位 → 输出 JSON + 质量报告 → 校验。
2. 首屏：`index.html` 内联脚本读设置并应用主题/字号 → 加载 React → 拉 `meta.json` + `catalog.json` → 首页或按路由进入阅读页。
3. 阅读：路由 `c0001` → 查 catalog 状态 → 缺失则渲染占位；否则拉 `chapters/c0001.json` → 渲染段落 → 预取下一章 → 节流保存进度。
4. 离线：Service Worker 预缓存壳与哈希资源；data 请求走 `NetworkFirst` 并按访问缓存；更新时提示刷新。

### 4.3 模块划分

| 模块 | 职责 | 关键文件（计划） |
| --- | --- | --- |
| 应用壳 | 启动、路由、错误边界、全局布局 | `src/main.jsx`、`src/App.jsx`、`src/router.js` |
| 数据层 | catalog/chapter 加载、校验、缓存、预取 | `src/lib/dataClient.js`、`src/hooks/useCatalog.js`、`useChapter.js` |
| 阅读核心 | 当前章、前后章、进度、书签、键盘/手势 | `src/pages/ReaderPage.jsx`、`src/hooks/useProgress.js`、`useBookmarks.js` |
| 排版与主题 | CSS 变量、主题表、设置面板、首屏应用 | `src/styles/*`、`src/components/SettingsPanel.jsx`、`src/lib/settings.js` |
| 目录与搜索 | 虚拟列表、分组、过滤、跳转 | `src/components/ChapterList.jsx`、`src/pages/SearchPage.jsx` |
| 动效 | 四个组件、能力检测、降级、懒加载 | `src/components/effects/*`、`src/hooks/useReducedMotion.js` |
| 平台 | PWA 注册、存储、导出/导入、版本提示 | `src/lib/storage.js`、`src/lib/platform.js` |
| 语料工具 | 解析、清洗、选版、覆盖、报告、校验 | `tools/build_corpus.py`、`tools/validate_corpus.py`、`tools/overrides.json` |

模块之间只通过 props/context 和纯函数交互；数据层不依赖 React，便于单测。

## 5. 目录结构（目标态）

```text
E:\全职法师阅读网站\
├─ AGENTS.md
├─ README.md
├─ package.json
├─ package-lock.json
├─ vite.config.js
├─ index.html
├─ .gitignore
├─ .github/workflows/deploy.yml
├─ docs/
│  ├─ conventions.md
│  ├─ requirements.md
│  ├─ user-stories.md
│  ├─ architecture.md
│  ├─ data-design.md
│  ├─ design-system.md
│  ├─ deployment.md
│  ├─ tasks.md
│  ├─ verification.md
│  ├─ glossary.md
│  ├─ specs/spec-v1.md
│  ├─ plans/plan-v1.md
│  └─ decisions/decision-01-frontend-stack.md
│                 decision-02-hosting-and-data.md
├─ src/
│  ├─ main.jsx
│  ├─ App.jsx
│  ├─ router.js
│  ├─ pages/（Home/Reader/Shelf/Search/Settings/About/NotFound）
│  ├─ components/（ChapterList、SettingsPanel、ThemePicker、ReaderToolbar、
│  │              ProgressBar、MissingChapterNotice、effects/…）
│  ├─ hooks/（useCatalog、useChapter、useSettings、useProgress、useBookmarks、
│  │          useReducedMotion、useMediaQuery、useVirtualList）
│  ├─ lib/（dataClient、storage、settings、progress、bookmarks、format、audio）
│  ├─ styles/（tokens.css、themes.css、base.css、reader.css、home.css、motion.css）
│  └─ assets/（mofan-hero.webp、mofan-hero.jpg、可选标题子集字体）
├─ public/
│  ├─ data/（meta.json、catalog.json、chapters/c0001.json…）
│  ├─ icons/（192/512/maskable）
│  ├─ manifest.webmanifest（由 vite-plugin-pwa 生成，不手写）
│  └─ robots.txt
├─ tools/
│  ├─ build_corpus.py
│  ├─ validate_corpus.py
│  ├─ overrides.json
│  ├─ check_data.mjs
│  └─ tests/test_build_corpus.py
├─ prototype/（reader.html、home.html：确认视觉的静态原型）
├─ reports/（quality-report.json、manual-review.csv；进 git）
├─ tests/e2e/（reader.spec.js、mobile.spec.js、offline.spec.js）
├─ assets/mofan-hero.jpg（源素材，不直接引用）
├─ 全法原本/（原文，.gitignore）
└─ 4 个设计稿 .md（只读输入）
```

> 初始化仓库时，`全法原本/` 与 4 个设计稿保留原位，不移动、不改名；`.gitignore` 只忽略原文与构建缓存。是否把设计稿纳入 git 由用户决定，默认纳入（体积小、可追溯）。

## 6. 页面与路由

| 路由 | 页面 | 核心内容 | 是否加载重动效 |
| --- | --- | --- | --- |
| `#/` | 首页 | 描边书名、莫凡主图、继续阅读、近期书签、目录/搜索/设置入口、统计 | 是（懒加载，可关） |
| `#/read/c0001` | 阅读页 | 章节标题、正文、上下章、目录抽屉、设置抽屉、书签 | 否（只保留轻量过渡） |
| `#/shelf` | 书架 | 继续阅读、书签列表、最近阅读、导出/导入、清空 | 否 |
| `#/search` | 搜索 | 章节号/标题搜索、结果列表、空状态 | 否 |
| `#/settings` | 设置 | 主题、字号、字体、行距、段距、页宽、动效开关、数据管理 | 否 |
| `#/about` | 关于 | 书名/作者/简介、文本来源、缺失说明、版权声明、版本 | 否 |
| 其它 | 404 | 「页面不存在」+ 返回首页 | 否 |

设计要点：

- 阅读页的设置抽屉与 `#/settings` 共用组件；抽屉只是移动端更快的入口。
- 目录抽屉在桌面是左侧栏（≥1024 px），移动端是全屏抽屉；不新开路由。
- 所有路由都可直接打开/刷新/分享；hash 路由不触发服务器 404。
- 阅读页顶部栏滚动隐藏、上滑出现；点击正文中间区域切换工具栏（移动端）。

## 7. 阅读器状态模型

```js
// qfs.settings.v1
{
  version: 1,
  theme: 'paper',                 // paper|sepia|mint|night|oled|arcane
  fontSize: 20,                   // 14–32
  fontFamily: 'serif',            // serif|sans|system
  lineHeight: 1.85,               // 1.5–2.2
  paragraphGap: 0.9,              // 0–1.5 em
  pageWidth: 'medium',            // narrow|medium|wide|full
  justify: false,
  showProgress: true,
  effects: { title: true, halftone: true, cursor: true, wheel: true },
  reduceMotion: 'auto'            // auto|on|off
}

// qfs.progress.v1
{
  version: 1,
  current: 'c0123',
  positions: { 'c0123': 0.42 },   // 章内滚动比例 0–1
  history: ['c0123', 'c0122', 'c0121'],
  updatedAt: 1795200000000
}

// qfs.bookmarks.v1
{
  version: 1,
  items: [{ id: 'c0123', at: 1795200000000 }]
}
```

规则：

- 设置变更立即写回；进度/滚动节流 500 ms；`visibilitychange`/`pagehide` 补写。
- 阅读位置以「滚动比例」保存，字号/页宽变化后仍能大致回到原处。
- 当前章缺失时，`current` 指向最近的可用章；历史里保留缺失章会显示「缺失」标记但不自动打开。
- 三个 schema 都做结构校验；版本不匹配时按字段合并默认值，未知字段丢弃，损坏时备份到 `qfs.backup.<key>` 再重置。

## 8. 数据加载与错误处理

### 8.1 加载顺序

1. `index.html` 内联脚本：读 `qfs.settings.v1`，设置 `<html data-theme>`、`--reader-font-size`，避免闪白。
2. React 启动：并行请求 `data/meta.json` 与 `data/catalog.json`（用默认缓存策略，由 SW 控制新鲜度）；失败重试 1 次。
3. 首页：读 progress/bookmarks，渲染「继续阅读」或「开始阅读」。
4. 阅读页：从 catalog 查 `n` → 缺失则占位；正常则请求章节 JSON；成功后渲染并把下一章加入预取队列。
5. 渲染后恢复滚动位置（双 `requestAnimationFrame`，等字体/布局稳定）。

### 8.2 错误矩阵

| 场景 | 页面表现 | 数据状态 |
| --- | --- | --- |
| catalog/meta 请求失败 | 全屏错误卡：「加载失败，请检查网络」+ 重试按钮 | 不写任何存储 |
| catalog 解析失败/结构不符 | 同上，附「数据版本不匹配」提示 | 不写 |
| 章节 404/解析失败 | 阅读页错误卡：「本章加载失败」+ 重试 + 返回目录 | 不覆盖原进度 |
| 章节标记缺失 | 灰底提示卡：「第 2893 章 原文缺失」+ 上一章/下一章 + 补章说明 | 不生成假正文 |
| 未知章节 id | 「章节不存在」+ 返回目录 | 不改进度 |
| localStorage 损坏 | 使用默认值 + 顶部 toast「本地数据损坏，已重置」 | 备份原值后重置 |
| WebGL2 不可用/初始化失败 | 主图静态、光标关闭、标题静态绘制 | 不影响阅读 |
| Service Worker 更新 | 底部条「有新版本，点击刷新」 | 用户确认后 `skipWaiting` |

### 8.3 缓存策略

- 内存：catalog 常驻；章节 LRU 20 章；预取下一章（空闲时）。
- 浏览器：静态资源带 hash，长期缓存；`data/*` 由 SW `NetworkFirst`（3 s 超时回退缓存）。
- Service Worker：只预缓存壳；data 按访问缓存，上限 80 章（约 1 MB）；v1.1 提供「缓存全书」（约 22 MB，需用户确认）。
- 版本：`meta.json` 含 `builtAt` 与 `sourceHash`；更新部署后 SW 检测到新 precache 清单，提示刷新。

## 9. 主题与排版（摘要）

- 6 套主题：`paper` 纸白、`sepia` 羊皮纸、`mint` 护眼绿、`night` 夜间、`oled` 纯黑、`arcane` 魔法夜（深蓝）。全部用 CSS 变量，正文对比度 ≥ 4.5:1（大字号 ≥ 3:1）。
- 字号 14–32 px，步进 1；预设「小 16 / 标准 20 / 大 24 / 特大 28」，移动端默认 18、桌面 20（首次运行按视口决定，之后以用户设置为准）。
- 字体三选：宋体（衬线，默认）、黑体（无衬线）、系统默认；只用系统字体栈，不下载在线字体。
- 行距 1.5–2.2，段距 0–1.5 em，页宽四档（34/42/52/100% 正文列宽），可选两端对齐。
- 正文段落由构建期去掉源文件段首全角空格，页面用 `text-indent: 2em` 统一缩进；保留作者括号注，不特殊渲染。
- 详细 token、页面布局、组件状态见 `docs/design-system.md`。

## 10. 动效系统

| 动效 | 位置 | 依赖 | 触发 | 降级 |
| --- | --- | --- | --- | --- |
| StrokeText 描边标题 | 首页 H1「全职法师」 | GSAP + ScrollTrigger | 挂载时描边绘制 → 填充；hover 重绘 | 静态实心标题；`prefers-reduced-motion` 直接显示 |
| HalftoneReveal 半调显影 | 首页主图 | WebGL2 | 挂载淡入；鼠标/触摸显影；点击波纹 | 静态 `<img>` + 渐变遮罩；无 WebGL 时直接显示 |
| GlowCursor 光斑光标 | 首页背景层 | WebGL2 | 指针移动/点击 | 关闭；触摸设备默认关闭 |
| OptionWheel 章节轮盘 | 阅读页浮层 | 无（原生 rAF） | 按钮/快捷键 `C` 打开；滚轮/拖拽/方向键 | 保留上一章/下一章按钮；轮盘不可用不影响阅读 |

实现纪律：

- 四个组件放 `src/components/effects/`；首页三个重动效（标题/半调/光标）用 `React.lazy` + `requestIdleCallback`（兜底 300 ms）挂载；阅读页只加载轻量的 OptionWheel（rAF），不加载 GSAP 与 WebGL。
- 每个组件外层包 `EffectBoundary`：catch 初始化异常 → 渲染 fallback，不冒泡到页面。
- 统一读 `useReducedMotion()` 与 `useDeviceProfile()`（触摸、`deviceMemory`、`hardwareConcurrency`、WebGL2 可用性）；低端机默认关闭光标与半调动画。
- 所有动效有设置开关，立即生效并持久化。
- 不用 GIF/视频；主图压缩为 WebP（桌面 ≤250 KB、移动 ≤120 KB），`<picture>` + `srcset`，`fetchpriority="high"`，避免 CLS。
- 时间线：标题 1.6 s 绘制 + 0.2 s 填充延迟；主图 0.8 s 淡入；页面切换 180 ms；章节切换 220 ms；不叠加超过 2 个同时运行的动画。
- 详细参数与视觉稿见 `docs/design-system.md`。

## 11. 数据契约（摘要）

- `data/meta.json`：schema、书名/作者、总数/可用数/缺失数、总字数、源文件 SHA-256、构建时间、工具版本、缺失章节列表。
- `data/catalog.json`：紧凑数组 `[n, title, chars, status]`；`status` 0 正常、1 缺失；另含 `volumes`（每 100 章一组，仅导航，非原著分卷）。
- `data/chapters/cNNNN.json`：`{ n, title, paras, srcLine }`；缺失章为 `{ n, missing: true, title: '（原文缺失）', paras: [] }`。
- `reports/quality-report.json`：候选数、唯一数、缺失组、重复组、选版统计、清洗统计、人工待审清单。
- 所有 JSON UTF-8 无 BOM、LF、2 空格缩进（生成物不追求最小体积，便于 diff）；字段细节与校验规则见 `docs/data-design.md`。

## 12. 构建、测试与部署

- 本地：`npm run dev`（Vite）→ `npm run build` → `npm run preview`；语料重建用 Python 脚本。
- CI：`npm ci` → `npm run data:check` → `npm run build` → `actions/upload-pages-artifact` → `actions/deploy-pages`。
- 测试分层：Python 管线单测（规则/选版/校验）→ Vitest/RTL（存储、主题、进度、搜索、边界）→ Playwright（真实浏览器、移动视口、深链、离线）。
- 部署：仓库 `main` 分支 push 触发；Pages Source 设为 GitHub Actions；`base: './'` 保证子路径可用；hash 路由无 404 问题。
- 细节与命令见 `docs/deployment.md`。

## 13. 性能预算

| 指标 | 预算 | 测量方式 |
| --- | --- | --- |
| 阅读页首包 JS | ≤110 KB gzip | `vite build` 报告 + Network |
| 首页动效 chunk（懒加载） | ≤130 KB gzip | 同上；GSAP 单独 chunk |
| CSS | ≤25 KB gzip | 构建报告 |
| catalog | ≤60 KB gzip | `catalog`/Network |
| 单章 JSON | ≤12 KB gzip | 抽样 10 章 |
| 首页主图 | 桌面 ≤250 KB、移动 ≤120 KB | WebP 文件 |
| LCP / CLS / INP | ≤2.5 s / ≤0.1 / ≤200 ms | Lighthouse 移动模拟 |
| 目录滚动 | 3,233 项虚拟化，滚动不掉帧 | 真机 390×844 |
| 动效 | 桌面 60 fps；移动 30 fps 可接受；低端机关闭 | DevTools Performance |

## 14. 风险与缓解

| 级别 | 风险 | 影响 | 缓解 |
| --- | --- | --- | --- |
| P0 | 132 章缺失（含连续 100 章） | 读者断档，体验不完整 | 占位卡明示；补章清单；`overrides` + 补章合并脚本；不伪造 |
| P0 | 版权与公开暴露 | 仓库/站点可能被投诉下架 | 页面 `noindex`、`robots.txt`、无广告；仓库可改私有（Pages 需付费）；用户自行决定公开范围 |
| P1 | 原文本错号/截断/脱敏 | 错章、读不通 | 选版规则 + 质量报告 + 55 组冲突人工复核；上线前抽样 30 章对照 |
| P1 | 国内访问 GitHub Pages 不稳定 | 手机打不开/慢 | 先实测；备选 Cloudflare Pages 同 dist 部署；自定义域名 |
| P1 | WebGL 动效耗电/掉帧 | 低端机卡顿 | 触摸/低端默认关光标与半调；`quality` 降级；可关闭 |
| P1 | 偏离无构建基线 | 与既有约定不一致 | ADR-01 明示；只允许这一处；不引其它依赖 |
| P2 | 22 MB 数据与 3,233 文件 | 首次/批量缓存慢 | 按章加载；catalog 单独；SW 按需缓存；v1.1 全书缓存显式触发 |
| P2 | SW 缓存旧章 | 更新后读到旧内容 | `meta.builtAt` 版本化；NetworkFirst；更新提示 |
| P2 | 标题字体跨设备差异 | 描边标题排版跳动 | 用系统衬线 + 预留宽度；可选 4 字子集字体；测量后固定 viewBox |
| P2 | 微信/内置浏览器兼容 | 手势/存储受限 | 标准 API + 降级；不依赖 `beforeinstallprompt` |

## 15. 里程碑与任务映射

| 里程碑 | 内容 | 任务 | 退出标准 |
| --- | --- | --- | --- |
| M0 基线 | 仓库、脚手架上、文档、CI 干跑 | T-01 | `npm run dev` 起得来；空壳 CI 构建成功 |
| M1 语料 | 解析/清洗/选版/报告/校验 | T-02 | `public/data` 生成；缺失 132、可用 3,101 与报告一致 |
| M2 骨架与原型 | 视觉原型、路由、数据加载、目录 | T-03、T-04 | 首页/阅读页可点；目录 3,233 项可跳 |
| M3 阅读核心 | 排版/主题/进度/书签/搜索 | T-05、T-06、T-07 | R-03～R-11 验收通过 |
| M4 体验 | 首页动效、章节轮盘、移动端/无障碍/降级 | T-08、T-09、T-11 | R-07、R-12～R-14、R-19 通过 |
| M5 上线 | PWA、E2E、Pages 部署、README/验证 | T-10、T-12、T-13 | 线上 URL 手机可读；R-15～R-18、R-20 通过 |

详细任务表见 `docs/tasks.md`，技术顺序与退出标准见 `docs/plans/plan-v1.md`。

## 16. 待确认事项（开工前最多先问 2 个）

1. **仓库公开范围**：公开仓库（免费 Pages、文本公开）还是私有仓库 + 其他托管？这影响版权暴露与部署步骤。
2. **缺失 132 章**：先按占位上线，还是你能补一份完整文本（或指定补章来源）再开工？后者会改变 M1 的验收口径。

其余默认值（不对就纠正）：

- 仓库名默认 `qzfs-reader`，URL 形如 `https://<你的用户名>.github.io/qzfs-reader/`。
- 主题默认「纸白」，衬线字体，移动端 18 px、桌面 20 px。
- 动效默认开启（低端/触摸设备自动降级），阅读页默认无重动效。
- 首页主图使用已复制的 `assets/mofan-hero.jpg`；如版权/喜好不合适可替换。
- v1 不做全文搜索与全书离线；先保证读得顺。

## 17. 下个工作区启动提示词（可直接粘贴）

```text
你是「全职法师阅读网站」的实现工程师。当前目录 E:\全职法师阅读网站。

第一步，按顺序读：
1) AGENTS.md
2) docs/conventions.md
3) docs/requirements.md
4) docs/specs/spec-v1.md
5) docs/plans/plan-v1.md
6) docs/architecture.md
7) docs/data-design.md
8) docs/design-system.md
9) docs/deployment.md

读完先停下，用不超过 15 行复述：目标、非目标、X-01～X-04 四项偏离、当前里程碑（M0）、下一步（T-01）、你准备先动哪些文件。然后问我最多 2 个关键问题：
- 仓库公开还是私有？
- 缺失的 132 章先占位上线，还是等补全文本？

我确认后，从 T-01 开始，一次只做一个可独立验收的小步；每步结束给我：改了哪些文件、跑了什么命令、真实结果、未完成项、下一步。不要改 R-01～R-20 的规则，不要引后端/数据库/UI 库/CDN，不要提交 全法原本/ 原文，不要把绝对路径写进代码。遇到不确定的版本或 API 先查再写，不猜。
```
