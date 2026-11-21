# 全职法师 · 阅读站

单部小说《全职法师》（作者：乱）的个人静态阅读站。移动优先，纯静态，部署在 GitHub Pages；支持字号/主题/字体/行距/页宽调节、目录搜索、进度与书签、PWA 离线；首页带描边标题、半调主图、光斑光标，阅读页带章节轮盘。

> **当前状态：M1 语料管线完成（T-02），静态数据已生成；M2 页面与目录待接入（2026-11-21）。**
> `public/data/` 已含 3,233 章（3,101 可读、132 缺失），`npm run build` 可用；首页/阅读页仍是 M0 空壳。

## 素材

| 素材 | 位置 | 说明 |
| --- | --- | --- |
| 原文 | `全法原本/《全职法师》作者：乱.txt` | 32.9 MB，UTF-8，不入 git |
| 首页主图 | `assets/mofan-hero.jpg` | 1952×1172，莫凡与穆宁雪 |
| 标题动效 | `全职法师标题.md` | React Bits `StrokeText` |
| 主图动效 | `首页莫凡形象设计.md` | `HalftoneReveal` |
| 章节切换 | `章节切换设计.md` | `OptionWheel` |
| 光标动效 | `光标动效.md` | `GlowCursor` |

## 文档导航

| 想了解 | 看 |
| --- | --- |
| 项目范围、技术栈、不能违反的规则 | [AGENTS.md](AGENTS.md) |
| 工程约定与四项偏离 | [docs/conventions.md](docs/conventions.md) |
| 需求规则 R-01～R-20 | [docs/requirements.md](docs/requirements.md) |
| 用户故事 | [docs/user-stories.md](docs/user-stories.md) |
| 系统架构、路由、状态、性能、风险 | [docs/architecture.md](docs/architecture.md) |
| 语料质量、清洗选版、JSON 契约 | [docs/data-design.md](docs/data-design.md) |
| 视觉、六主题、动效与降级 | [docs/design-system.md](docs/design-system.md) |
| GitHub Pages、Actions、PWA | [docs/deployment.md](docs/deployment.md) |
| v1 交付契约 | [docs/specs/spec-v1.md](docs/specs/spec-v1.md) |
| 实施计划与里程碑 | [docs/plans/plan-v1.md](docs/plans/plan-v1.md) |
| 任务表 T-01～T-13 | [docs/tasks.md](docs/tasks.md) |
| 验收清单与记录模板 | [docs/verification.md](docs/verification.md) |
| 术语 | [docs/glossary.md](docs/glossary.md) |
| 为什么用 React/Vite | [docs/decisions/decision-01-frontend-stack.md](docs/decisions/decision-01-frontend-stack.md) |
| 为什么 hash 路由/静态 JSON | [docs/decisions/decision-02-hosting-and-data.md](docs/decisions/decision-02-hosting-and-data.md) |

## 本地运行

```powershell
npm install        # 首次安装
npm run dev        # http://127.0.0.1:5173
npm run build      # 生产构建到 dist/
npm run preview    # 预览 dist/
npm run data:check # 校验 public/data
```

语料重建（已生成，改原文后才需要）：

```powershell
python tools/build_corpus.py --input "全法原本/《全职法师》作者：乱.txt" --out public/data --report reports/quality-report.json
python tools/validate_corpus.py --data public/data --source "全法原本/《全职法师》作者：乱.txt"
```

> `public/data/` 约 22 MB、3,235 个文件；不要手改，改数据只能改 `tools/` 或 `tools/overrides.json` 后重跑。`全法原本/` 不入库。

## 测试与验收

```powershell
python -m unittest discover -s tools/tests -v      # 8 passed
python tools/validate_corpus.py --data public/data # PASS
npm run data:check                                 # PASS
npm test                                           # M3 起接入 Vitest
npm run test:e2e                                   # M5 起接入 Playwright
```

> 当前 M1 结果：3,233 章 / 3,101 可读 / 132 缺失 / 7,101,261 字；详见 [docs/verification.md](docs/verification.md)。
> 验收结果统一写进 [docs/verification.md](docs/verification.md)。

## 部署

push 到 `main` 后 GitHub Actions 自动构建并发布到 GitHub Pages。首次需在仓库 Settings → Pages 把 Source 设为 **GitHub Actions**。URL 形如：

```text
https://<你的 GitHub 用户名>.github.io/qzfs-reader/
```

详细步骤、回滚与国内访问备选见 [docs/deployment.md](docs/deployment.md)。

## 已知限制（v1）

- 原文缺失 132 章（其中 2,893–2,992 连续 100 章），页面以「原文缺失」占位，不补写。
- 原文本为多轮抓取拼接稿，含 6,696 处 `⚹` 脱敏占位；保留原样，关于页说明。
- 进度/书签只存本机，跨设备靠导出/导入，不做云同步。
- 只搜章节号与标题，不做全文搜索。
- 只缓存访问过的章节，不自动下载全书。

## 版权

小说《全职法师》版权归原作者「乱」及出版方所有。本站仅个人阅读使用，不提供下载、不做广告、不收录评论；页面 `noindex`，如权利人要求可删除。代码部分可另行约定许可证。

## 已确认与待确认

已确认（2026-11-21）：

1. 仓库：**公开仓库 + GitHub Pages**，站点在 `https://<user>.github.io/qzfs-reader/` 子路径下。
2. 132 章缺失：v1 先按「原文缺失」占位上线；补章走人工提供同版本文本 + 导入校验工具，不做网页抓取、不补写。

待确认：

1. 首页主图是否使用现有 `assets/mofan-hero.jpg`？
2. 默认主题「纸白」、默认衬线字体是否合适？
3. 章节轮盘是否需要声音？
