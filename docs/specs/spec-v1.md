# v1 交付规格（spec）

> 状态：待用户确认
> 规则来源：`docs/requirements.md` 的 R-01～R-20。本文件不复述全部规则，只定义「v1 交什么、达到什么算完成、什么不做」。
> 任何实现层面的取舍，先回到本文件与 R 规则；冲突时以 R 规则为准并同步更新。

## 1. 交付物

| 编号 | 交付物 | 形态 | 验收 |
| --- | --- | --- | --- |
| D1 | 可运行的前端应用 | `src/` + `public/`，`npm run dev/build` | 首页、阅读页、书架、搜索、设置、关于、404 可打开 |
| D2 | 语料构建管线 | `tools/build_corpus.py` 等，Python 3.12 标准库 | 一条命令生成 3,233 条目录、3,101 正文、132 占位；报告可读 |
| D3 | 静态数据 | `public/data/meta.json`、`catalog.json`、`chapters/*.json` | 通过 `validate_corpus.py` 与 `check_data.mjs` |
| D4 | 自动化测试 | `tests/`（Vitest/Playwright）+ `tools/tests/`（unittest） | 全部通过；结果写入验证记录 |
| D5 | 线上站点 | GitHub Pages 子路径 | 手机与桌面可打开；深链可刷新；PWA 可安装 |
| D6 | 文档 | `docs/` 全套 + README | README 四段；规则编号贯通；验证记录有真实结果 |

## 2. 范围（v1 必须做）

按里程碑划分，细节见 `docs/plans/plan-v1.md` 与 `docs/tasks.md`。

### M0 工程基线
- 仓库、Vite/React 脚手架、目录、`npm run dev/build`、CI 空跑。
- `index.html` 内联主题脚本、`noindex`；PWA manifest 可后置到 M5。
- 不写业务页面也能构建出空壳（Pages 部署链路在 M5 验证）。

### M1 语料
- 解析、清洗、选版、覆盖、缺失占位、质量报告、校验。
- 输出与 `docs/data-design.md` 契约一致；基线数字：3,233 / 3,101 / 132。
- 55 组标题冲突有清单；至少人工确认前 10 组。

### M2 骨架与视觉原型
- `prototype/reader.html`（或等价静态页）确认阅读页排版、六主题、工具栏，不接真实数据。
- hash 路由、数据加载层、目录虚拟列表、首页/阅读页骨架。
- 首页/阅读页在 360、390、768、1024、1440 五档可看。

### M3 阅读核心
- 阅读页正文渲染、字号/主题/字体/行距/段距/页宽/对齐（R-03～R-05）。
- 目录、搜索、章节切换（按钮/键盘/滑动）、进度、书签、书架、导入导出（R-06～R-11）。
- 缺失章提示、未知章 404、存储损坏回退。

### M4 体验与动效
- 首页 StrokeText、HalftoneReveal、GlowCursor；阅读页 OptionWheel。
- 动效开关、reduced-motion、WebGL 降级、低端设备判定（R-12）。
- 响应式、移动端手势、可访问性、性能收口（R-13、R-18、R-19）。

### M5 上线
- PWA manifest/SW/图标/更新提示（R-15）。
- Playwright E2E、真机验收、Pages 部署、README、验证记录（R-16、R-17、R-20）。

## 3. 范围外（v1 不做）

- 全文搜索（只做章节号/标题；v1.1 评估索引体积）。
- 全书离线下载（只缓存访问过的章节；v1.1）。
- 分页/仿真翻页（v1 滚动）。
- 账号、云同步、评论、统计、广告、多书、书源抓取。
- 自动补全缺失章、AI 续写/改写。
- 桌面端/小程序/App。
- 自定义字体上传、主题自定义取色（v1 固定六套）。

## 4. 规则覆盖矩阵

| 里程碑 | 规则 |
| --- | --- |
| M0 | R-14、R-16（骨架）、R-20（noindex） |
| M1 | R-17 |
| M2 | R-01、R-02、R-06（目录骨架）、R-13（布局） |
| M3 | R-02～R-11、R-14 |
| M4 | R-07、R-12、R-13、R-18、R-19 |
| M5 | R-15～R-20 |

验收场景以 `docs/requirements.md` §6 为准；每条规则至少有一个自动化或手工验收记录。

## 5. 数据契约（必须遵守）

- 章节总数固定 3,233，`n` 连续 1–3,233，id 为 `c` + 四位零填充。
- 缺失章 `missing: true`、`paras: []`、目录状态 1；不得删除或改号。
- 正常章 `paras.length > 0`；构建期去掉段首全角空格、BOM、站点广告；保留 `⚹`。
- `meta.source.sha256` 与输入原文一致；`meta.chapters.available + missing = 3233`。
- JSON UTF-8 无 BOM、LF；`schema: 1`；字段名 lowerCamelCase。
- 相对路径；不出现盘符、用户名、`http(s)://` 资源链接。

## 6. 非功能门槛

| 项 | 门槛 |
| --- | --- |
| 阅读页首包 JS | ≤110 KB gzip |
| 首页动效 chunk | ≤130 KB gzip，懒加载 |
| CSS | ≤25 KB gzip |
| catalog | ≤60 KB gzip |
| 单章 | ≤12 KB gzip |
| 主图 | 桌面 ≤250 KB、移动 ≤120 KB |
| LCP / CLS / INP | ≤2.5 s / ≤0.1 / ≤200 ms（移动 4G 模拟） |
| 浏览器 | Chrome/Edge 最近两个大版本、iOS Safari 16+、Android Chrome |
| 无障碍 | 键盘全流程可达；axe 无 critical/serious |
| 隐私 | 仅同源请求；无统计/广告/账号 |

## 7. 完成定义（DoD）

1. D1–D6 全部交付；R-01～R-20 有实现或明确的「未实现」记录。
2. `npm run build`、`npm test`、`npm run test:e2e`、`python -m unittest` 通过；`npm run data:check` 通过。
3. 线上 URL 手机实测：首页、阅读、主题、字号、深链、缺失章、离线、书签、进度读回。
4. 五档视口无横向滚动；六主题对比度达标；reduced-motion/无 WebGL 降级正常。
5. `docs/verification.md` 写入真实命令、通过数、未通过项、浏览器版本、线上 URL、回滚点。
6. README 四段齐全；`全法原本/` 未被提交；仓库无 >50 MB 单文件。

## 8. 待确认（影响验收口径）

1. 仓库公开/私有。
2. 132 章：先占位，还是等补全文本。
3. 主图是否用现有素材。
4. 默认主题与默认字体。
5. 章节轮盘是否需要声音。

> 未确认项不阻塞 M0/M1；涉及 M3/M4 的默认值先按 `docs/architecture.md` §16 的假设执行，并在验证记录里标明。
