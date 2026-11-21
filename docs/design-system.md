# 视觉与交互设计系统

> 版本：v1（2026-11-21）
> 依据：用户提供的 4 份 React Bits 组件稿、`assets/mofan-hero.jpg`、主设计会话的工程约定。
> 目标：首页有辨识度，阅读页安静；所有动效可关、可降级；手机上单手可读。

## 1. 视觉方向

关键词：**红莲与冰晶、夜色纸页、克制**。

- 首页是「电影海报」：深色夜底、莫凡与穆宁雪的红蓝对撞、描边书名、半调显影；只在这一页重动效。
- 阅读页是「纸」：去掉装饰、降低对比噪音，正文是唯一主角；六套背景都按纸/墨关系设计。
- 强调色只用两枚：余烬橙 `#e2603f`（火）与冰蓝 `#7fb6ff`（冰）；金色 `#f0b26b` 只用于标题描边与激活态。
- 动效时长偏慢（1.6 s 描边），但页面切换偏快（180 ms），避免拖沓。

## 2. 色彩 Token

### 2.1 全局

```css
:root {
  --ember: #e2603f;
  --ice: #7fb6ff;
  --gold: #f0b26b;
  --moon: #f4f2ea;
  --home-bg: #0a0d14;
  --home-bg-2: #111827;
  --home-text: #f4f2ea;
  --home-muted: #a8afbd;
  --focus: #f0b26b;
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 20px;
  --radius-pill: 999px;
  --shadow-soft: 0 8px 30px rgb(0 0 0 / 18%);
  --dur-fast: 120ms;
  --dur-base: 180ms;
  --dur-slow: 240ms;
  --ease-out: cubic-bezier(0.22, 1, 0.36, 1);
}
```

### 2.2 阅读主题（`data-theme`）

| id | 名称 | 背景 | 纸面 | 正文 | 次要文字 | 强调 | 边框 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `paper` | 纸白 | `#f6f1e7` | `#fffaf0` | `#2b2622` | `#6b6258` | `#b4552d` | `#e2d8c6` |
| `sepia` | 羊皮纸 | `#efe0c8` | `#f7ead6` | `#4a3826` | `#7a6248` | `#9c5a2a` | `#ddc9a8` |
| `mint` | 护眼绿 | `#e4efdf` | `#edf6e9` | `#22301f` | `#5d6e58` | `#3f7a4e` | `#c9dcc2` |
| `night` | 夜间 | `#171a21` | `#1f232c` | `#d6d8df` | `#8f95a3` | `#e0a36b` | `#2b303b` |
| `oled` | 纯黑 | `#000000` | `#0c0c0f` | `#b9bcc4` | `#7c8088` | `#e0a36b` | `#1a1a1f` |
| `arcane` | 魔法夜 | `#0d1424` | `#141d33` | `#dbe4ff` | `#8fa0c8` | `#f0b26b` | `#223052` |

要求：

- 正文/背景对比度 ≥4.5:1（六套均需实测；`paper`、`sepia` 按此目标选色，上线前用工具复核）。
- 主题只改 CSS 变量；背景纹理用低透明度 CSS 渐变/SVG 噪点，不加载图片。
- 顶部/底部栏用 `--surface` + 半透明 `backdrop-filter`，纯黑主题不用发光。
- 选中文字背景用 `--accent`、前景 `--bg`；链接/按钮 focus 用 `--focus`。

## 3. 字体与排版

### 3.1 字体栈

```css
--font-serif: "Source Han Serif SC", "Noto Serif CJK SC", "Songti SC", "SimSun", serif;
--font-sans: "Source Han Sans SC", "Noto Sans CJK SC", "PingFang SC", "Microsoft YaHei", sans-serif;
--font-display: "Songti SC", "Source Han Serif SC", "Noto Serif CJK SC", Georgia, serif;
```

- 不下载在线字体；标题跨设备字形差异用「测量后固定 viewBox」消化。
- 可选增强（M4）：为「全职法师」四字做 OFL 子集 WOFF2（≤15 KB），保证移动端描边形状一致；不改变正文系统字体策略。

### 3.2 阅读字号与行距

| 项 | 桌面 | 移动 |
| --- | --- | --- |
| 默认字号 | 20 px | 18 px |
| 字号范围 | 14–32 px，步进 1 | 同 |
| 行距 | 1.85（1.5–2.2） | 同 |
| 段距 | 0.9 em（0–1.5） | 同 |
| 正文列宽 | narrow 34em / medium 42em / wide 52em / full 100% | 同，按视口 |
| 段首缩进 | 2em | 2em |
| 对齐 | 左对齐默认；可开两端对齐 | 默认关 |
| 正文色 | `--text` | 同 |

正文 `max-width: 42em`，两侧留白 ≥24 px（移动 20 px）；标题与正文间距 1.2em；章节首段不额外放大。

## 4. 间距、圆角、层级

- 间距：4 / 8 / 12 / 16 / 24 / 32 / 48 / 64。
- 圆角：按钮 10 px、卡片 16 px、抽屉 24 px（仅内侧）、主题色块 12 px。
- 层级：正文 0；顶部栏 20；底部栏 20；抽屉遮罩 40；抽屉 50；轮盘 60；Toast 70。
- 触控目标 ≥44×44；图标 20–24 px；正文可点区域不设 `user-select: none`。

## 5. 页面布局

### 5.1 首页（桌面 ≥1024）

```text
┌──────────────────────────────────────────────────────────────┐
│ 全职法师 · 阅读站          [目录] [搜索] [书架] [设置]         │ 64px
├───────────────────────────────┬──────────────────────────────┤
│                               │                              │
│   全职法师（StrokeText 描边）  │   HalftoneReveal 主图         │
│   QUAN ZHI FA SHI             │   （莫凡/穆宁雪，半调显影）    │
│   一觉醒来，世界大变。         │                              │
│                               │                              │
│   [ 继续阅读 · 第 12 章 ]      │                              │
│   [ 目录 ]  [ 搜索 ]           │                              │
│                               │                              │
│   3,233 章 · 3,101 章可读       │                              │
│   累计 711 万字 · 132 章原文缺失│                              │
└───────────────────────────────┴──────────────────────────────┘
   背景：深色渐变 + GlowCursor 光斑（仅桌面、可关）
```

- 左栏 46%，右栏 54%；主图 `object-fit: cover`，焦点在人物面部（`object-position: 58% 40%`）。
- 标题 4 字用 StrokeText；副标题用 12 px 字距 0.35em 的拉丁字母。
- CTA 主按钮余烬橙描边/填充；次按钮幽灵样式。
- 底部细线统计条，数字用 tabular-nums。
- 滚动到下一屏：继续阅读卡、最近书签、六套主题预览、关于文本。

### 5.2 首页（移动 ≤767）

```text
┌──────────────────────────┐
│ 全职法师        [目录] ⋯ │
│                          │
│   （主图铺满，半调显影）   │
│   ┌────────────────────┐ │
│   │ 全职法师（描边）    │ │
│   │ QUAN ZHI FA SHI    │ │
│   │ 继续阅读 · 第12章   │ │
│   └────────────────────┘ │
│   3,233 章 · 132 章缺失   │
└──────────────────────────┘
```

- 主图作为背景，底部叠加深色渐变保证文字对比；标题 56–64 px。
- 关闭半调动画时直接用 `<img>` + 渐变遮罩。
- 顶部只留「目录」与「更多」；更多打开底部菜单。

### 5.3 阅读页（桌面 ≥1024）

```text
┌──────────────┬───────────────────────────────────────────────┐
│ 目录（可收起）│  ← 返回   第 12 章 雷之力，雷印！   [书签][Aa] │ 56px
│ 第1卷 1-100  │ ───────────────────────────────────────────── │ 3px 进度
│ 第1章        │                                               │
│ …            │        正文（max-width 42em，居中）           │
│ 第12章 ●     │        　　水兰中学外，小雨淅沥沥的下着。      │
│ 第13章       │        　　校门外，挤满了撑着雨伞的家长……      │
│ …            │                                               │
│              │  ┌─────────────────────────────────────────┐  │
│              │  │ 上一章            目录            下一章 │  │ 64px
└──────────────┴───────────────────────────────────────────────┘
```

- 目录侧栏 280 px，可收起；移动端为全屏抽屉。
- 标题栏：返回、章节号+标题（超长省略）、书签、字号/设置。
- 底部栏固定；桌面显示快捷键提示（`←` `→` 翻章，`C` 轮盘）。
- 正文顶部留 24 px，底部留 96 px 防止被栏遮挡。

### 5.4 设置抽屉

- 桌面右侧 360 px，移动全屏。
- 分组：主题（6 个色块，带名称与选中环）→ 字号（滑杆 + 预设）→ 字体 → 行距/段距 → 页宽/对齐 → 动效开关 → 恢复默认。
- 每个控件有当前值文本；滑杆支持键盘；切换即时预览，不点「保存」。
- 底部「恢复默认」需二次确认（`confirm` 或内联确认条）。

### 5.5 书架 / 搜索 / 关于

- 书架：顶部「继续阅读」大卡；下面「书签」列表（章节号、标题、添加时间、删除）；「最近阅读」最多 20 条；底部「导出备份 / 导入备份 / 清空数据」。
- 搜索：顶部输入框自动聚焦；结果行显示章节号+标题+匹配片段；空状态文案「没有找到相关章节」；底部提示「v1 只搜索章节号与标题」。
- 关于：书名、作者、简介、文本来源与 SHA、缺失 132 章说明、`⚹` 说明、版权声明、版本与构建时间、GitHub 链接（可选）。

## 6. 组件清单与状态

| 组件 | 状态 | 说明 |
| --- | --- | --- |
| `Button` | default / hover / active / disabled / loading | 主/次/幽灵/危险四种 |
| `IconButton` | default / active / disabled | `aria-label` 必填 |
| `ThemeSwatch` | default / selected / focus | 色块 + 名称 + 选中环 |
| `Slider` | default / focus / disabled | 显示当前值；键盘 ±1 |
| `Switch` | on / off / disabled | 动效开关 |
| `Drawer` | closed / opening / open / closing | 焦点陷阱、Esc、遮罩点击 |
| `ChapterRow` | normal / current / read / bookmarked / missing | 44 px 高；缺失行禁用 |
| `MissingNotice` | — | 标题、说明、上一章/下一章、补章说明链接 |
| `Toast` | info / success / error | 3 s 自动消失；错误可手动关 |
| `Skeleton` | — | 首页/目录/阅读页加载 |
| `EmptyState` | — | 图标 + 文案 + 行动按钮 |
| `SearchResult` | — | 高亮匹配片段（React 节点，不用 innerHTML） |
| `ChapterWheel` | closed / open / dragging | 包裹 OptionWheel，窗口化 ±20 章 |
| `EffectBoundary` | normal / fallback | 捕获 WebGL/GSAP 异常 |

## 7. 动效规范

### 7.1 四个组件的落位与参数

| 组件 | 落位 | 建议参数 | 降级 |
| --- | --- | --- | --- |
| `StrokeText` | 首页 H1 | `text="全职法师"`、`strokeColor="#f0b26b"`、`fillColor="#f4f2ea"`、`strokeWidth=1.6`、`drawDuration=1.6`、`fillDelay=0.2`、`stagger=0.09`、`fillMode="wipe"`、`wipeFrom="left"`、`fontSize=112`（桌面）/`60`（移动）、`fontWeight=800`、`letterSpacing=6`、`hoverRedraw`、`shadow`、`shadowColor="#e2603f"`、`trigger="mount"` | 静态实心标题 |
| `HalftoneReveal` | 首页主图 | `mode="color"`、`shape="dot"`、`cellSize=4`、`angle=15`、`contrast=1.08`、`revealRadius=180`、`softness=0.5`、`linger=1.2`、`intro`、`clickBurst`、`fit="cover"`、`paperColor="#0a0d14"` | 静态 `<img>` + 渐变遮罩 |
| `GlowCursor` | 首页背景层 | `color="#e2603f"`、`secondaryColor="#7fb6ff"`、`intensity=0.55`、`trailWidth=4`、`linger=0.7`、`glow=0.5`、`followSpeed=0.55`、`quality="high"`（低端 `"medium"`）、`theme="dark"`、`clickBurst` | 不加载，无光标层 |
| `OptionWheel` | 阅读页轮盘浮层 | 窗口 ±20 章、`fontSize=2.2`（桌面）/`1.6`（移动）、`spacing=1.45`、`curve=1.35`、`tilt=5`、`blur=2`、`fade=0.25`、`smoothing=300`、`side="right"`、`inset=40`、`loop=false`、`draggable`、无声音 | 只保留按钮/键盘翻章 |

### 7.2 时间线与节奏

| 场景 | 时长 | 说明 |
| --- | --- | --- |
| 标题描边 | 1.6 s | 挂载即开始；reduced-motion 直接结束态 |
| 标题填充 | 0.8 s | 描边后 0.2 s 开始 |
| 主图淡入 | 0.8 s | 与描边并行，不抢焦点 |
| 首页元素入场 | 0.5 s，stagger 0.08 | 最多 4 个元素 |
| 页面切换 | 180 ms | 淡入淡出，不滑动整页 |
| 章节切换 | 220 ms | 内容淡入；滚动复位即时 |
| 抽屉 | 240 ms | 遮罩 160 ms |
| Toast | 进入 160 ms / 停留 3 s / 退出 200 ms | |

- 同时运行的动画 ≤2 组；首页动效全部在 `requestIdleCallback` 后挂载；阅读页不加载 GSAP/WebGL。
- 鼠标进入标题可重绘（`hoverRedraw`），但不阻塞点击 CTA。

### 7.3 降级判定

```text
reduceMotion = settings.reduceMotion === 'on'
  || (settings.reduceMotion === 'auto' && matchMedia('(prefers-reduced-motion: reduce)').matches)

disableHalftone = reduceMotion || !webgl2 || deviceMemory <= 4 || saveData
disableCursor   = reduceMotion || isTouch || deviceMemory <= 4 || hardwareConcurrency <= 4
disableTitle    = reduceMotion   // 静态标题仍保留样式
```

- 动效初始化异常由 `EffectBoundary` 捕获，只记录一次 `console.warn`，显示 fallback。
- 页面隐藏（`visibilitychange`）时暂停 rAF/canvas；恢复时继续。
- 四个组件保留原文件头注释与 React Bits 来源说明，按组件仓库许可证使用（以实际 LICENSE 为准）；不引入付费 GSAP 插件。

## 8. 响应式断点

| 断点 | 布局 |
| --- | --- |
| `<480` | 单列；首页主图背景；阅读页全屏；底部栏 64 px；字号默认 18 |
| `480–767` | 单列；首页标题 64 px；目录全屏抽屉 |
| `768–1023` | 两列首页；阅读页目录抽屉（不常驻）；正文 42em |
| `≥1024` | 首页左右 46/54；阅读页目录侧栏 280 px；设置右侧抽屉 |
| `≥1440` | 内容最大宽 1200 px 居中；首页标题 112 px |

横屏手机：首页改为左右布局；阅读页保持单列，工具栏收窄。

## 9. 无障碍

- 语义：`<header> <nav> <main> <article>`；阅读页 `h1` 为章节标题，正文段落 `<p>`。
- 跳转链接「跳到正文」在 Tab 第一项。
- 所有图标按钮 `aria-label`；开关 `role="switch"` + `aria-checked`；抽屉 `role="dialog"` + `aria-modal` + 焦点陷阱。
- 键盘：`←/→` 翻章、`↑/↓` 滚动、`Esc` 关抽屉/轮盘、`C` 轮盘、`B` 书签、`F` 全屏、`?` 快捷键帮助。
- 章节切换后 `aria-live="polite"` 播报「第 12 章 雷之力，雷印！」。
- 焦点样式：`outline: 2px solid var(--focus); outline-offset: 2px`，不删除 outline。
- 对比度：正文 ≥4.5:1；按钮/标签 ≥4.5:1；禁用态仍可辨识（不只靠颜色）。
- `prefers-reduced-motion` 全站生效；不自动播放声音。

## 10. 素材与图片

| 素材 | 处理 |
| --- | --- |
| `assets/mofan-hero.jpg` 1952×1172 | 生成 1600×960 WebP（目标 ≤220 KB）、960×576 WebP（≤100 KB）、JPG 兜底；保留原图不入页面 |
| 主图裁切 | 桌面焦点 58% 40%；移动 62% 35%；禁用 `object-fit: fill` |
| PWA 图标 | 192、512、512 maskable；用书名首字「全」或火焰/冰晶符号，深底金字 |
| 图标 | 内联 SVG 24×24，stroke 1.8；不引图标库 |
| 纹理 | CSS 渐变 + SVG feTurbulence 噪点（data URI，≤2 KB） |

图片必须写 `width`/`height` 或 `aspect-ratio`，避免 CLS；首页主图 `preload`，移动端用 `<source media>`。

## 11. 文案与空状态

| 场景 | 文案 |
| --- | --- |
| 首页 CTA（无进度） | 开始阅读 |
| 首页 CTA（有进度） | 继续阅读 · 第 12 章 |
| 加载中 | 正在加载… |
| 目录空（不应出现） | 目录加载失败 |
| 搜索无结果 | 没有找到相关章节 |
| 缺失章 | 第 2893 章 原文缺失；本节暂未收录，可先读相邻章节。 |
| 未知章节 | 章节不存在 |
| 离线未缓存 | 当前离线，本章尚未缓存。 |
| 存储损坏 | 本地数据损坏，已重置。 |
| 新版本 | 有新版本，点击刷新。 |
| 书架空 | 还没有书签。在阅读页点右上角书签图标即可添加。 |
| 404 | 页面不存在 |

语气：短、具体、不卖萌；错误给下一步动作。

## 12. 验收清单（视觉/交互）

- [ ] 首页桌面/移动两种布局与设计稿一致；标题、主图、CTA 层级清晰。
- [ ] 六套主题切换无闪白、对比度达标、选中态明显。
- [ ] 字号 14/32、页宽四档、行距两端、对齐开关均无溢出。
- [ ] 阅读页在 360/390/768/1024/1440 五档无横向滚动。
- [ ] 目录 3,233 项滚动顺滑；缺失/当前/书签标记可见。
- [ ] 轮盘在桌面与移动端可用；`Esc` 关闭；选择后跳章。
- [ ] reduced-motion / 无 WebGL / 触摸设备三种降级均正常。
- [ ] 键盘可完成：首页 → 第 1 章 → 设置改字号 → 下一章 → 加书签。
- [ ] 空状态、错误状态、Toast 文案齐全。
