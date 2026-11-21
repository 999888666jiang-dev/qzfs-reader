# 部署与发布（GitHub Pages）

> 目标：`https://<user>.github.io/<repo>/` 可打开、可刷新深链、手机可访问、push 自动部署。
> 前提：Node 24、npm 11、git、GitHub 账号；构建不需要服务器。

## 1. 仓库策略

| 项 | 决定 | 理由 |
| --- | --- | --- |
| 仓库名 | `qzfs-reader`（可改，URL 随之变化） | 短、ASCII、与书名对应 |
| 可见性 | 待用户确认（默认公开） | 公开 = 免费 Pages；私有 = Pages 需 GitHub Pro |
| 分支 | `main` 唯一长期分支 | 简单；PR 可选 |
| 提交内容 | `src/`、`public/data/`、`tools/`、`docs/`、配置、图标 | Pages 只需生成物与源码 |
| 不提交 | `全法原本/`、`node_modules/`、`dist/`、`.venv/`、`reports/*.tmp` | 体积/隐私/可重建 |
| 大文件 | 无（单文件 ≤5 MB） | 不触发 GitHub 警告；不用 LFS |
| 许可证 | 代码可 MIT；文本版权归原作者，站点声明 | 避免误解 |

`.gitignore` 至少包含：

```gitignore
node_modules/
dist/
全法原本/
*.tmp
reports/*.tmp
.DS_Store
Thumbs.db
.env
.env.*
```

> `public/data/` 必须提交；CI 不重建语料，只校验。原文留在本机，`meta.json` 记录 SHA-256。

## 2. 初始化步骤

```powershell
cd E:\全职法师阅读网站
git init
git add .
git commit -m "chore: scaffold reader site with architecture docs"
git branch -M main
gh repo create qzfs-reader --public --source . --remote origin --push
```

如果不用 `gh`：在 GitHub 网页新建空仓库，再 `git remote add origin <url>` + `git push -u origin main`。

初始化前确认：

- `npm install` 成功生成 `package-lock.json`；
- `public/data/` 已由 `tools/build_corpus.py` 生成并通过 `validate_corpus.py`；
- `全法原本/` 已被 `.gitignore` 排除（`git status` 看不到它）；
- 四个设计稿 `.md` 与 `assets/` 是否入库，由用户决定（默认入库，体积小）。

## 3. 关键配置

### 3.1 `vite.config.js`

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: './',
  plugins: [react()],
  server: { host: '127.0.0.1', port: 5173 },
  build: { outDir: 'dist', assetsDir: 'assets', sourcemap: false }
})
```

- `base: './'` 是子路径可用的关键；不要在代码里写 `/assets/`。
- `public/` 下的 `manifest.webmanifest`、`sw.js`、`icons/`、`mofan-hero.jpg` 会原样复制到 `dist/`。

### 3.2 PWA（手写，不依赖 `vite-plugin-pwa`）

实际实现：

| 文件 | 作用 |
| --- | --- |
| `public/manifest.webmanifest` | `start_url`/`scope` 均为 `./`；图标 192/512/maskable |
| `public/sw.js` | 缓存壳 `qfs-v1`；导航网络优先回退 `index.html`；`/data/` 网络优先并缓存；静态资源缓存优先 |
| `src/main.jsx` | 仅 `import.meta.env.PROD` 时注册 `new URL('sw.js', document.baseURI)` |
| `public/icons/*` | 由 `python tools/make_icons.py` 生成（180/192/512/maskable/favicon） |

说明：

- 当前 SW 用 `skipWaiting` 直接切换，**没有**「有新版本」提示；这是 M5 前的基础版。
- 只缓存访问过的章节；全书缓存不在 v1。
- 子路径下 `start_url: './'` 与 `scope: './'` 会解析到 `/qzfs-reader/`，无需改代码。
- 不需要在 `vite.config.js` 引入任何 PWA 插件；不要把两套 manifest/SW 混用。

### 3.3 `index.html`

必须包含：

```html
<meta name="robots" content="noindex,nofollow" />
<meta name="theme-color" content="#0a0d14" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<link rel="manifest" href="./manifest.webmanifest" />
<link rel="icon" type="image/png" href="./icons/favicon.png" />
<link rel="apple-touch-icon" href="./icons/apple-touch-icon.png" />
<script>
  // 首屏前应用主题/字号，避免闪白；失败静默回退 paper
  try {
    const s = JSON.parse(localStorage.getItem('qfs.settings.v1') || '{}');
    document.documentElement.dataset.theme = s.theme || 'paper';
    if (s.fontSize) document.documentElement.style.setProperty('--reader-font-size', s.fontSize + 'px');
  } catch (_) {}
</script>
```

> `<body>` 第一行放 `<noscript>本站需要启用 JavaScript 才能阅读。</noscript>`（`<noscript>` 里不要放文本到 `<head>`）。
> manifest 由本项目手写，不要同时再让构建插件注入第二个。
> `robots.txt` 放在 `public/`：`User-agent: *` + `Disallow: /`。

### 3.4 `package.json` scripts（约定）

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:e2e": "playwright test",
    "data:check": "node tools/check_data.mjs"
  }
}
```

版本在初始化时用 `npm view` 查稳定版并锁进 `package-lock.json`；不手写猜测的版本号。

## 4. GitHub Actions

`.github/workflows/deploy.yml`：

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 24
          cache: npm
      - run: npm ci
      - run: npm run data:check
      - run: npm run build
      - uses: actions/configure-pages@v5
      - uses: actions/upload-pages-artifact@v4
        with:
          path: dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

> Action 主版本以官方 marketplace 当前稳定版为准；首次配置时核对，不盲目升级。失败先看 Actions 日志，不要反复重跑掩盖问题。

## 5. Pages 设置

1. 仓库 → Settings → Pages。
2. Build and deployment → Source 选 **GitHub Actions**（不要选 Deploy from a branch）。
3. 首次 Actions 成功后，访问 `https://<user>.github.io/qzfs-reader/`。
4. 可选：Custom domain 填自己的域名，按提示加 CNAME；HTTPS 自动签发。
5. 可选：Environment `github-pages` 加保护规则（仅 main 可部署）。

## 6. 上线验证清单

- [ ] `https://<user>.github.io/<repo>/` 首页正常，无 404 资源。
- [ ] 直接打开 `.../#/read/c0001` 正常；刷新仍正常。
- [ ] 手机蜂窝网络打开首页 ≤3 s（首屏文字可见）。
- [ ] 切主题、调字号 → 刷新保持；无首帧闪白。
- [ ] 打开第 1 章 → 飞行模式 → 第 1 章仍可读；未访问章节提示离线。
- [ ] 安装到主屏（iOS Safari / Android Chrome）→ 图标、名称、启动画面正常。
- [ ] Network 面板无第三方请求；`<meta name="robots">` 生效。
- [ ] 缺失章 `c2893` 显示提示而非空白。
- [ ] `npm run data:check` 在 CI 通过；Actions 全绿。
- [ ] 手机 390×844 无横向滚动；按钮可点。

## 7. 更新与回滚

**更新**

1. 本机改代码/数据 → `npm run build` + `npm test` 通过。
2. 提交并 push 到 `main` → Actions 自动部署。
3. 已安装 PWA 的用户当前会由 `skipWaiting` 直接切到新版本（没有「有新版本」提示；提示列为 M5 完善项），刷新后生效。
4. 若改了语料，先跑 `validate_corpus.py`，并对比 `quality-report.json` 的缺失/冲突数。

**回滚**

- 最快：GitHub → Actions → 找到上一个成功 deployment → Re-run（或 Revert commit 后 push）。
- 代码回滚用 `git revert <sha>`，不要强推 `main`。
- 数据回滚：`public/data` 与 `tools/` 一起回滚，避免目录与正文不一致。
- 回滚后确认 Pages 缓存：硬刷新 / 清 SW；旧 SW 可能短暂缓存旧壳。

## 8. 国内访问与备选托管

GitHub Pages 在国内可能慢或间歇不可达。先实测，不提前假设：

- 首选：GitHub Pages + 自定义域名（有时改善）。
- 备选：同一 `dist/` 部署 Cloudflare Pages / Vercel（免费，国内有时更快）；只改托管，不改代码。
- 不建议为此引入后端或镜像站；阅读数据是静态的，换托管成本低。
- 若长期不可用，再评估对象存储 + CDN；不要把访问问题误判为代码问题。

## 9. 版权与暴露面

- 页面 `noindex,nofollow` + `robots.txt`；不提交 sitemap；不做 SEO。
- 关于页写明：文本版权归原作者「乱」及出版方；站点为个人阅读使用；可联系删除。
- 仓库公开意味着全文可被克隆；如不接受，改私有仓库（Pages 需付费）或换托管。
- 不做全文下载按钮、不做导出 TXT、不做分享到公开平台。
- 不在仓库放来源站点链接/广告；`全法原本/` 不入库。

## 10. 常见故障

| 现象 | 可能原因 | 处理 |
| --- | --- | --- |
| 首页白屏 | `base` 配错、JS 404、路由未匹配 | Network 看资源路径；确认 `base: './'`；看 Console |
| 刷新深链 404 | 用了 history 路由 | 改回 hash 路由，或加 404.html（本项目不采用） |
| 数据 404 | `public/data` 未提交/未生成 | 本地跑构建；`git ls-files public/data \| Select-Object -First 5` 确认 |
| 主题闪白 | 内联脚本缺失/在 CSS 后 | 把脚本放 `<head>` 最前，先设 `data-theme` |
| PWA 不更新 | `autoUpdate` 或旧 SW 缓存 | 用 `prompt`；清 site data 后重试 |
| 手机字体过大溢出 | 固定 px 容器/未允许换行 | 正文容器 `overflow-wrap: anywhere`；检查 32 px 边界 |
| Actions 部署失败 | 权限/环境未设 | 检查 `permissions`、Pages Source、environment |
| 图片不显示 | 路径大小写/未优化 | Linux 区分大小写；统一小写文件名 |

## 11. 发布记录模板

每次上线在 `docs/verification.md` 追加：

```text
日期 / 提交 SHA / 构建号
改动：
验证：首页 / 阅读 / 主题 / 字号 / 深链 / 离线 / 缺失章 / 手机
结果：通过 x 项，未通过 y 项（原因）
线上 URL：
回滚点：<上一个成功 SHA>
```
