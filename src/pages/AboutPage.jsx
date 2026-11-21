import { useCatalog } from '../hooks/useCatalog'
import { formatChars, formatCount } from '../lib/format'
import Icon from '../components/Icon'

export default function AboutPage() {
  const { status, meta, error, retry } = useCatalog()
  const missing = meta?.missing || []

  return (
    <div className="page">
      <header className="page-top">
        <a href="#/" className="icon-button" aria-label="返回首页"><Icon name="left" /></a>
        <h1>关于</h1>
        <a href="#/settings" className="icon-button" aria-label="阅读设置"><Icon name="settings" /></a>
      </header>

      <main className="page-main page-main--narrow">
        <section className="about-card">
          <p className="section-kicker">全职法师</p>
          <h2>关于文本</h2>
          <p>作者：乱。本站是个人阅读用的静态站点，不提供下载、广告或评论。</p>
          {status === 'error' ? (
            <div className="state-card state-card--error">
              <p>{error?.message || '元数据加载失败。'}</p>
              <button type="button" className="btn btn--primary" onClick={retry}>重试</button>
            </div>
          ) : null}
          {meta ? (
            <dl className="about-stats">
              <div><dt>总章节</dt><dd>{formatCount(meta.chapters.total)}</dd></div>
              <div><dt>可读</dt><dd>{formatCount(meta.chapters.available)}</dd></div>
              <div><dt>缺失</dt><dd>{formatCount(meta.chapters.missing)}</dd></div>
              <div><dt>总字数</dt><dd>{formatChars(meta.chars)}</dd></div>
            </dl>
          ) : (
            <p className="muted">正在读取数据…</p>
          )}
        </section>

        <section className="about-card">
          <h2>缺失章节</h2>
          <p>
            原文本有 132 章缺失，其中 2,893–2,992 连续缺 100 章。缺失章保留号位，页面显示「原文缺失」，
            不补写、不改号、不伪造正文。
          </p>
          {missing.length ? (
            <p className="missing-numbers">
              {missing.slice(0, 18).map(n => `第 ${n} 章`).join('、')}
              {missing.length > 18 ? ` 等 ${missing.length} 章` : ''}
            </p>
          ) : null}
          <p className="muted">
            补章需要同一版本的真实文本，导入校验后合并；本站不做网页抓取。
          </p>
        </section>

        <section className="about-card">
          <h2>文本说明</h2>
          <p>
            原文本是多轮抓取拼接稿，正文中的 <code>⚹</code>（U+26B9）是源文件脱敏占位，保留原样；
            构建时只清理站点广告、BOM 与页码等噪音，不改写正文。
          </p>
          {meta ? (
            <dl className="about-meta">
              <div><dt>源文件</dt><dd>{meta.source.file}</dd></div>
              <div><dt>源文件 SHA-256</dt><dd className="mono">{meta.source.sha256}</dd></div>
              <div><dt>构建时间</dt><dd>{meta.builtAt}</dd></div>
            </dl>
          ) : null}
        </section>

        <section className="about-card">
          <h2>版权</h2>
          <p>
            小说《全职法师》版权归原作者「乱」及出版方所有。本站仅个人阅读使用，不提供全文下载；
            页面禁止索引，如权利人要求可删除。
          </p>
          <p className="muted">版本：v0.1.0 · M0/M1 完成，页面接入中。</p>
        </section>
      </main>
    </div>
  )
}
