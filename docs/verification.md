# 验证记录

> 状态：**M0（T-01）与 M1（T-02）已执行**；M2 起的页面、动效、PWA 与线上验收待执行（2026-11-21）。
> 本文是验收清单与记录模板；实现过程中每完成一项，把「待执行」改为「通过 / 未通过 / 不适用」，并附证据（命令输出、截图、URL、浏览器版本）。
> 禁止预填「通过」；禁止用「应该可以」代替实测。

## 1. 环境

| 项 | 记录 |
| --- | --- |
| 日期 | 待填 |
| 提交 SHA | 待填 |
| Node / npm | 待填（当前环境 Node 24.16.0 / npm 11.13.0） |
| 浏览器 | 待填（Chrome/Edge 版本、Safari iOS 版本、Android 机型） |
| 线上 URL | 待填 |
| 回滚点 | 待填（上一个成功部署 SHA） |

## 2. 语料管线

命令：

```powershell
python tools/build_corpus.py --input "全法原本/《全职法师》作者：乱.txt" --out public/data --report reports/quality-report.json
python tools/validate_corpus.py --data public/data
python -m unittest discover -s tools/tests -v
node tools/check_data.mjs
```

| 检查 | 期望 | 实际 | 状态 |
| --- | --- | --- | --- |
| 目录总数 | 3,233 | 3,233 | 通过 |
| 可用正文 | 3,101 | 3,101 | 通过 |
| 缺失 | 132（2,893–2,992 等） | 132 | 通过 |
| 章节文件 | 3,233（含 132 占位） | 3,233 | 通过 |
| 广告残留 | 0 | 0（校验通过） | 通过 |
| BOM/零宽 | 0 | 0（校验通过） | 通过 |
| 总字数 | 7,101,261 ±1% | 7,101,261 | 通过 |
| 选版冲突 | 55 组有清单；人工确认 ≥10 组 | 55 组清单；33 组待人工 | 未完成 |
| `validate_corpus.py` | 退出码 0 | `PASS: 3233 chapters, 132 missing, 7101261 chars, 3233 files` | 通过 |
| unittest | 全部通过 | 7 tests OK | 通过 |
| `check_data.mjs` | 退出码 0 | `PASS: 3233 chapters, 132 missing, 7101261 chars, 3233 files, meta 1758 B` | 通过 |

## 3. 功能验收（按 R 规则）

| 规则 | 验收动作 | 期望 | 实际 | 状态 |
| --- | --- | --- | --- | --- |
| R-01 | 清空数据打开首页；点主按钮 | 显示「开始阅读」，落在第 1 章 | 待填 | 待执行 |
| R-02 | 打开 `#/read/c2893`；`#/read/c9999` | 缺失提示；章节不存在 | 待填 | 待执行 |
| R-03 | 字号 14/32；越界 13/33 | 生效/被拒；360 px 无横滚 | 待填 | 待执行 |
| R-04 | 六主题切换 + 刷新；对比度抽查 | 保持；无闪白；≥4.5:1 | 待填 | 待执行 |
| R-05 | 字体/行距/段距/页宽/对齐 + 恢复默认 | 即时生效并持久化 | 待填 | 待执行 |
| R-06 | 目录 3,233 项；搜索 2893/世界 | 缺失标记/结果正确；滚动顺滑 | 待填 | 待执行 |
| R-07 | 按钮、←/→、滑动、轮盘；首尾章 | 全部可用；边界禁用 + 提示 | 待填 | 待执行 |
| R-08 | 第 12 章 50% → 刷新 → 首页继续 | 回到 45–55% | 待填 | 待执行 |
| R-09 | 加书签/重复加/删除/刷新 | 不重复、可跳转、持久化 | 待填 | 待执行 |
| R-10 | 搜「莫凡」「9999」「第12章」 | 高亮/空状态/置顶 | 待填 | 待执行 |
| R-11 | 写入坏 JSON；导出/导入/坏文件导入 | 回退 + 提示；恢复；坏文件不改原数据 | 待填 | 待执行 |
| R-12 | reduced-motion；禁 WebGL；触摸设备 | 静态降级；功能正常 | 待填 | 待执行 |
| R-13 | 360/390/768/1024/1440 全页面 | 无横向滚动；按钮 ≥44 px | 待填 | 待执行 |
| R-14 | 新标签深链；未知路由；后退 | 直接打开；404；状态保留 | 待填 | 待执行 |
| R-15 | 安装 PWA；飞行模式读已访问章；新版本 | 可安装；可离线；刷新提示 | 待填 | 待执行 |
| R-16 | 线上子路径；Network；深链刷新 | 无 404；深链可用；Actions 绿 | 待填 | 待执行 |
| R-17 | 抽查 20 章；关于页缺失说明 | 无广告；132 章说明可见 | 待填 | 待执行 |
| R-18 | Lighthouse 移动；构建体积；目录滚动 | 达预算；无长任务 | 待填 | 待执行 |
| R-19 | 纯键盘全流程；axe | 可达；无 critical/serious | 待填 | 待执行 |
| R-20 | Network；`noindex`；robots；关于页 | 仅同源；声明可见 | 待填 | 待执行 |

## 4. 自动化测试

| 套件 | 命令 | 期望 | 实际 | 状态 |
| --- | --- | --- | --- | --- |
| 语料单测 | `python -m unittest discover -s tools/tests -v` | 全部通过 | 待填 | 待执行 |
| 前端单测 | `npm test` | 全部通过 | 待填 | 待执行 |
| 数据校验 | `npm run data:check` | 退出码 0 | 待填 | 待执行 |
| E2E | `npm run build && npm run test:e2e` | 全部通过 | 待填 | 待执行 |
| 构建 | `npm run build` | 成功，无警告级错误 | 待填 | 待执行 |

E2E 最小集：

1. 首页 → 开始阅读 → 第 1 章。
2. 改主题/字号 → 刷新 → 保持。
3. 下一章 → 目录跳转 → 书签 → 书架。
4. 深链 `#/read/c0500` 刷新。
5. 缺失章 `#/read/c2893` 提示。
6. 移动视口 390×844 无横向滚动。
7. （可选）离线：访问第 1 章 → 断网 → 仍可读。

## 5. 性能与体积

| 项 | 预算 | 实际 | 状态 |
| --- | --- | --- | --- |
| 阅读页首包 JS | ≤110 KB gzip | 待填 | 待执行 |
| 首页动效 chunk | ≤130 KB gzip | 待填 | 待执行 |
| CSS | ≤25 KB gzip | 待填 | 待执行 |
| catalog | ≤60 KB gzip | 待填 | 待执行 |
| 单章 | ≤12 KB gzip | 待填 | 待执行 |
| 主图桌面/移动 | ≤250 / ≤120 KB | 待填 | 待执行 |
| LCP / CLS / INP | ≤2.5 s / ≤0.1 / ≤200 ms | 待填 | 待执行 |
| Lighthouse Performance / Accessibility | ≥80 / ≥95 | 待填 | 待执行 |

## 6. 真机与浏览器

| 设备/浏览器 | 检查项 | 结果 |
| --- | --- | --- |
| iOS Safari（iPhone） | 首页、阅读、主题、字号、滑动、PWA 安装、飞行模式 | 待填 |
| Android Chrome | 同上 + 返回键关抽屉 | 待填 |
| 桌面 Chrome 1440×900 | 首页动效、目录侧栏、键盘、轮盘 | 待填 |
| 桌面 Edge | 同上 | 待填 |
| 微信内置浏览器 | 首页可读、翻章、设置持久化（不要求 PWA） | 待填 |

## 7. 部署验收

| 项 | 期望 | 实际 | 状态 |
| --- | --- | --- | --- |
| Actions build | 成功 | 待填 | 待执行 |
| Actions deploy | 成功 | 待填 | 待执行 |
| 首页 | 200，无 404 资源 | 待填 | 待执行 |
| 深链刷新 | 正常 | 待填 | 待执行 |
| `data/*` | 200，内容正确 | 待填 | 待执行 |
| PWA manifest | 可安装，图标正确 | 待填 | 待执行 |
| 回滚 | 可回上一版本 | 待填 | 待执行 |
| README | 四段齐全 | 待填 | 待执行 |

## 8. 未实现 / 未通过清单

| 项 | 原因 | 计划 |
| --- | --- | --- |
| 待填 | 待填 | 待填 |

## 9. 发布记录

```text
[日期] [提交 SHA] [构建号]
改动：
验证：
结果：
线上 URL：
回滚点：
```

## 10. 备注

- 若某项因环境限制（如无 iPhone）未测，写「未测 + 原因 + 替代验证」，不要标通过。
- 若发现规则本身有问题，先记「待确认」，不要边改规则边改代码；确认后同步 requirements/spec/tasks/tests。
- 测试数据不得写入正式 `public/data`；语料测试用临时目录。

## 11. T-01 工程基线（2026-11-21，提交 `1ddc4db`）

| 检查 | 命令 / 动作 | 实际结果 | 状态 |
| --- | --- | --- | --- |
| 运行时 | `node -v` / `npm -v` | v24.16.0 / 11.13.0 | 通过 |
| 依赖版本 | 先 `npm view` 查版本再安装 | react 19.3.1、react-dom 19.3.1、vite 8.3.8、@vitejs/plugin-react 6.3.0；`package-lock.json` 已生成 | 通过 |
| 开发服务 | `npm run dev` → `GET http://127.0.0.1:5173/` | HTTP 200，1441 B；含 `noindex, nofollow`、内联主题脚本、`#root`、`/src/main.jsx`（200） | 通过 |
| 生产构建 | `npm run build` | 成功：`dist/index.html` 1.28 kB；JS 220.08 kB（gzip 68.99 kB）；CSS 0.37 kB（gzip 0.25 kB） | 通过 |
| 子路径 | 检查 `dist/index.html` 的资源引用 | `./assets/index-*.js`、`./assets/index-*.css`，无 `/assets/` 绝对路径（R-16） | 通过 |
| 浏览器渲染（R-14 骨架） | Edge headless `--dump-dom "http://127.0.0.1:5173/#/read/c0001"` | `data-theme="paper"`、「全职法师 · 阅读站」、「当前路由 /read/c0001」均正确 | 通过 |
| 仓库卫生 | `git status --porcelain` | 输出为空；`全法原本/`、`node_modules/`、`dist/` 均未入库 | 通过 |
| 提交 | `git commit` | `1ddc4db chore: scaffold vite react reader shell (T-01)`，41 个跟踪文件 | 通过 |

未在本步验证（留到后续里程碑）：

- `npm test`、`npm run test:e2e`：脚本尚未接入（M3/M5）；`npm run data:check` 已在 M1 接入。
- PWA manifest / Service Worker / 图标：M5。
- 六主题切换与首帧无闪白：当前只有内联 `data-theme` 骨架，没有主题 CSS 与设置读写，R-04 留到 M3 验收。
- 页面、目录、语料：M1（语料）、M2（骨架）。

环境备注（影响后续步骤，先记录）：

- 本机系统级 `core.autocrlf=true`（`C:/Program Files/Git/etc/gitconfig`）。已加 `.gitattributes`（`* text=auto eol=lf`），避免 `public/data/*.json` 检出成 CRLF 与「JSON 必须 LF」契约冲突。
- 仓库提交身份暂为 `999888666jiang-dev <999888666jiang-dev@users.noreply.github.com>`，**只写在仓库本地配置**，未改全局 `user.email`（gitee noreply）。
- `gh` 当前账号 `999888666jiang-dev` 的 token 已失效（`gh auth status`），创建远端仓库与 Pages 部署（M5/T-13）前需 `gh auth refresh -h github.com`。

## 12. M1 语料管线（T-02，2026-11-21）

命令：

```powershell
python tools/build_corpus.py --input "全法原本/《全职法师》作者：乱.txt" --out public/data --report reports/quality-report.json --deterministic
python tools/validate_corpus.py --data public/data --source "全法原本/《全职法师》作者：乱.txt"
python -m unittest discover -s tools/tests -v
node tools/check_data.mjs
npm run build
```

| 检查 | 实际结果 | 状态 |
| --- | --- | --- |
| 目录总数 | 3,233 | 通过 |
| 可用正文 | 3,101 | 通过 |
| 缺失 | 132（2,893–2,992 100 章；957–963 7；965–966 2；1,863–1,866 4；其余 19） | 通过 |
| 章节文件 | 3,233（含 132 占位） | 通过 |
| 总字数 | 7,101,261（与文档基线 7,116,676 差 0.22%，在 ±1% 内） | 通过 |
| 清洗广告行 | 198 | 通过 |
| BOM | 移除 194 处 | 通过 |
| 选版 | 1,329 章取了更靠后的版本；重复组 1,356 | 通过 |
| 标题冲突 | 原始 55 组；清洗后 38 组；归一化后 36 组；needsManual 33 组 | 通过（待人工复核） |
| `⚹` | 原文 6,696；选版后正文 1,228 | 记录 |
| `validate_corpus.py` | `PASS: 3233 chapters, 132 missing, 7101261 chars, 3233 files` | 通过 |
| `unittest` | 7 tests OK | 通过 |
| `node tools/check_data.mjs` | `PASS: 3233 chapters, 132 missing, 7101261 chars, 3233 files, meta 1758 B` | 通过 |
| `npm run build` | 成功；`dist` 3,240 文件、22.2 MB；JS 220.08 kB（gzip 68.99 kB） | 通过 |
| 数据体积 | `public/data` 3,235 文件、22.0 MB | 通过（≤预算） |
| 抽查 | c0001「世界大变」；c1523「欧洲学府」；c3028「完整的冰晶刹弓」；c3227「邪庙女主人」；c2893 占位 | 通过 |

产物：

- `public/data/meta.json`、`catalog.json`、`chapters/c0001.json`…`c3233.json`
- `reports/quality-report.json`、`reports/manual-review.csv`
- `tools/build_corpus.py`、`tools/validate_corpus.py`、`tools/check_data.mjs`、`tools/overrides.json`、`tools/tests/test_build_corpus.py`

未完成 / 限制：

- 33 组 `needsManual` 只生成了清单（`reports/manual-review.csv`），尚未逐组人工确认；55 组原始冲突需在 M3 前抽查。
- `supplement/` 未使用；新增的 `全法原本/全职法师.txt` 经评估不是同版本完整全文（只覆盖 8 个旧缺口号且边界不同），未进入构建，详见 `reports/source-comparison-2026-11-21.md`。
- 2,893–2,992 仍为占位；没有可用补章文本。
- 页面仍是 M0 空壳；目录/阅读页消费数据在 M2。
