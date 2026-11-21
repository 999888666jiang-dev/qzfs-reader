# 开发任务表

> 按 T-01 → T-13 顺序执行；本版全部为交付必需，优先级统一「高」，次序由前置任务决定。
> 难度按实现 + 验证成本估计（低/中/高）。表中尚未存在的路径为计划产物。
> 依据：`docs/specs/spec-v1.md`、`docs/plans/plan-v1.md`、`docs/requirements.md`。

| 编号与任务 | 优先级 | 难度 | 前置任务 | 涉及文件 | 需求编号 | 验收条件 |
| --- | --- | --- | --- | --- | --- | --- |
| **T-01 工程基线** | 高 | 低 | 无 | `package.json`、`vite.config.js`、`index.html`、`.gitignore`、`src/main.jsx`、`src/App.jsx`、`README.md`、`.github/workflows/deploy.yml` | R-14、R-16、R-20 | `npm run dev` 可开；`npm run build` 成功；空壳 Actions 构建通过；`git status` 不含原文/node_modules/dist；`noindex` 与内联主题脚本存在。 |
| **T-02 语料管线** | 高 | 高 | T-01 | `tools/build_corpus.py`、`tools/validate_corpus.py`、`tools/overrides.json`、`tools/check_data.mjs`、`tools/tests/test_build_corpus.py`、`public/data/*`、`reports/*` | R-17、R-02 | 一条命令输出 3,233 条目录、3,101 正文、132 占位；`validate_corpus.py` 与 `check_data.mjs` 全过；质量报告含缺失/选版/清洗统计；55 组冲突有 CSV；抽 20 章无广告/BOM。 |
| **T-03 视觉原型** | 高 | 中 | T-01 | `prototype/reader.html`、`prototype/home.html`、截图 | R-03～R-05、R-13 | 单文件原型可切换六主题、字号 14/32、行距、页宽；360/390/768/1024/1440 五档无横向滚动；用户确认视觉后再进入 T-04。 |
| **T-04 应用骨架与数据层** | 高 | 中 | T-01、T-03 | `src/router.js`、`src/pages/*`、`src/lib/dataClient.js`、`src/hooks/useCatalog.js`、`useChapter.js`、`src/components/ChapterList.jsx`、`src/styles/tokens.css` | R-01、R-02、R-06、R-13、R-14 | 六个路由可打开/刷新；catalog 3,233 条加载；目录虚拟滚动；章节加载/错误/缺失占位；深链刷新正常。 |
| **T-05 排版与主题** | 高 | 中 | T-04 | `src/styles/themes.css`、`reader.css`、`src/components/SettingsPanel.jsx`、`ThemePicker.jsx`、`src/lib/settings.js`、`src/hooks/useSettings.js` | R-03～R-05、R-11 | 六主题即时切换并持久化；字号 14–32、字体、行距、段距、页宽、对齐全部生效；刷新读回；32 px/360 px 无横向滚动；首帧无闪白。 |
| **T-06 目录、搜索与章节切换** | 高 | 中 | T-04、T-05 | `src/components/ChapterList.jsx`、`SearchBox.jsx`、`src/pages/SearchPage.jsx`、`src/hooks/useVirtualList.js`、`ReaderPage.jsx` | R-06、R-07、R-10 | 目录 3,233 项含缺失标记；编号/标题搜索高亮、空状态、200 上限；上一/下一章、键盘、滑动；边界禁用 + 提示。 |
| **T-07 进度、书签与数据管理** | 高 | 中 | T-05、T-06 | `src/hooks/useProgress.js`、`useBookmarks.js`、`src/pages/ShelfPage.jsx`、`src/lib/storage.js` | R-08、R-09、R-11 | 进度误差 ≤5%；刷新/重开恢复；书签去重、增删、跳转；存储损坏回退 + 提示；导出/导入/清空通过。 |
| **T-08 首页动效与素材** | 高 | 高 | T-04 | `src/components/effects/StrokeText.jsx`、`HalftoneReveal.jsx`、`GlowCursor.jsx`、`EffectBoundary.jsx`、`src/pages/HomePage.jsx`、`src/assets/*` | R-01、R-12、R-18 | 首页标题描边、半调主图、光斑光标正常；懒加载不阻塞首屏；开关立即生效；主图 ≤250 KB；reduced-motion/无 WebGL 降级正常。 |
| **T-09 章节轮盘与移动端手势** | 高 | 高 | T-06、T-08 | `src/components/effects/OptionWheel.jsx`、`ChapterWheel.jsx`、`ReaderPage.jsx` | R-07、R-13 | 轮盘窗口 ±20 章、滚轮/拖拽/方向键可选、`Esc` 关闭、选择跳章；移动端滑动 60 px 翻章且不影响纵向滚动/选择文本。 |
| **T-10 PWA 与离线** | 高 | 中 | T-04、T-05 | `vite.config.js`、`public/icons/*`、`src/lib/pwa.js`、`src/components/UpdateToast.jsx` | R-15 | 可安装到主屏；已访问章节离线可读；未缓存章节离线提示；新版本提示刷新；manifest 图标齐全。 |
| **T-11 无障碍、降级与性能** | 高 | 中 | T-05、T-08、T-09 | 全站组件、`src/styles/*`、`src/hooks/useDeviceProfile.js`、`index.html` | R-12、R-13、R-18、R-19 | 纯键盘全流程可达；焦点可见；axe 无 critical/serious；五档视口无横向滚动；Lighthouse 移动 Performance ≥80、Accessibility ≥95；预算达标。 |
| **T-12 自动化测试与验证** | 高 | 高 | T-02、T-05～T-11 | `tests/e2e/*`、`src/**/*.test.jsx`、`tools/tests/*`、`docs/verification.md` | R-01～R-20 | Vitest、Playwright、unittest 全过或列明未过项；验证文档记录真实命令、通过数、浏览器版本、未实现项。 |
| **T-13 Pages 上线与 README** | 高 | 中 | T-12 | `.github/workflows/deploy.yml`、`README.md`、`docs/verification.md` | R-15～R-20 | `main` push 自动部署；线上 URL 手机可开；深链刷新、离线、缺失章、书签、进度实测通过；README 四段齐全；记录回滚点。 |

## 执行纪律

- 一次只做一个任务；任务内再拆「可独立验证的小步」，每步结束停下等验收。
- 任务开始前声明要动哪些文件；不顺手重构无关代码。
- 任务卡住超过一个验证周期，先记录「阻塞点 + 已尝试 + 需要什么」，不要连续叠加改动。
- 任务完成后同步更新：`docs/tasks.md` 状态（可选）、`docs/verification.md` 结果、相关 spec/需求（如有变化）。
- 任何需求变化先改 R 规则与 spec，再改任务与代码；不允许反向「代码先行」。
