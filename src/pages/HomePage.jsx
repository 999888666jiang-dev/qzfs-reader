import { useMemo, useState } from 'react'
import { useCatalog } from '../hooks/useCatalog'
import { loadBookmarks, loadProgress } from '../lib/storage'
import { chapterId, findChapter, nearestAvailable } from '../lib/chapters'
import { formatChars, formatCount } from '../lib/format'
import Icon from '../components/Icon'

export default function HomePage() {
  const { status, meta, catalog, error, retry } = useCatalog()
  const [imageFailed, setImageFailed] = useState(false)

  const progress = useMemo(() => loadProgress(), [])
  const bookmarks = useMemo(() => loadBookmarks(), [])

  const currentChapter = useMemo(() => {
    if (!catalog) return null
    const target = progress.current ? Number(progress.current.slice(1)) : 1
    const n = nearestAvailable(target, catalog.chapters)
    return findChapter(catalog.chapters, n)
  }, [catalog, progress.current])

  const recentBookmarks = useMemo(() => {
    if (!catalog) return []
    return bookmarks.items
      .map(item => findChapter(catalog.chapters, Number(item.id.slice(1))))
      .filter(Boolean)
      .slice(0, 4)
  }, [bookmarks, catalog])

  const continueLabel = progress.current ? '继续阅读' : '开始阅读'
  const continueHref = currentChapter ? `#/read/${chapterId(currentChapter.n)}` : '#/read/c0001'
  const heroImage = `${import.meta.env.BASE_URL}mofan-hero.jpg`

  return (
    <div className="home">
      <header className="home-top">
        <a className="brand" href="#/">
          <span className="brand-mark">全</span>
          <span>全职法师 · 阅读站</span>
        </a>
        <nav className="home-nav" aria-label="站内导航">
          <a href="#/toc"><Icon name="list" size={17} /><span>目录</span></a>
          <a href="#/search"><Icon name="search" size={17} /><span>搜索</span></a>
          <a href="#/shelf"><Icon name="bookmarks" size={17} /><span>书架</span></a>
          <a href="#/settings"><Icon name="settings" size={17} /><span>设置</span></a>
          <a href="#/about"><Icon name="book" size={17} /><span>关于</span></a>
        </nav>
      </header>

      <main>
        <section className="hero">
          <div className="hero-copy">
            <p className="eyebrow">乱 · 全系法师</p>
            <h1 className="hero-title">全职法师</h1>
            <p className="hero-subtitle">QUAN ZHI FA SHI</p>
            <p className="hero-lead">
              一觉醒来，世界大变。魔法为尊，而他全系全能。
              从水兰中学的学渣，到掌控世界的法师。
            </p>
            <div className="hero-actions">
              <a className="btn btn--primary" href={continueHref}>
                {continueLabel}
                {currentChapter ? ` · 第 ${currentChapter.n} 章` : ''}
              </a>
              <a className="btn btn--ghost" href="#/search">搜索章节</a>
            </div>
            <dl className="hero-stats">
              <div>
                <dt>总章节</dt>
                <dd>{meta ? formatCount(meta.chapters.total) : '—'}</dd>
              </div>
              <div>
                <dt>可读</dt>
                <dd>{meta ? formatCount(meta.chapters.available) : '—'}</dd>
              </div>
              <div>
                <dt>全文</dt>
                <dd>{meta ? formatChars(meta.chars) : '—'}</dd>
              </div>
            </dl>
          </div>

          <div className={`hero-art${imageFailed ? ' is-fallback' : ''}`} aria-hidden={imageFailed ? undefined : true}>
            {!imageFailed ? (
              <img
                src={heroImage}
                alt="莫凡与穆宁雪"
                width="1952"
                height="1172"
                fetchPriority="high"
                onError={() => setImageFailed(true)}
              />
            ) : null}
            <div className="hero-veil" />
            <span className="hero-caption">FULL-TIME MAGICIAN</span>
          </div>
        </section>

        {status === 'error' ? (
          <section className="state-card state-card--error">
            <h2>数据加载失败</h2>
            <p>{error?.message || '请检查网络后重试。'}</p>
            <button type="button" className="btn btn--primary" onClick={retry}>重试</button>
          </section>
        ) : null}

        <section className="home-section">
          <div className="section-head">
            <h2>开始阅读</h2>
            <a href="#/toc">全部目录 <Icon name="right" size={16} /></a>
          </div>
          <div className="quick-grid">
            <a className="quick-card quick-card--wide" href={continueHref}>
              <span className="quick-kicker">继续</span>
              <strong>{currentChapter ? `第 ${currentChapter.n} 章` : '第 1 章'}</strong>
              <span>{currentChapter?.title || '世界大变'}</span>
            </a>
            <a className="quick-card" href="#/shelf">
              <Icon name="bookmarks" />
              <strong>书架</strong>
              <span>{bookmarks.items.length ? `${bookmarks.items.length} 个书签` : '还没有书签'}</span>
            </a>
            <a className="quick-card" href="#/settings">
              <Icon name="settings" />
              <strong>阅读设置</strong>
              <span>字号 · 主题 · 行距</span>
            </a>
            <a className="quick-card" href="#/about">
              <Icon name="book" />
              <strong>关于文本</strong>
              <span>{meta ? `${meta.chapters.missing} 章缺失说明` : '来源与版权'}</span>
            </a>
          </div>
        </section>

        {recentBookmarks.length ? (
          <section className="home-section">
            <div className="section-head">
              <h2>最近书签</h2>
              <a href="#/shelf">全部 <Icon name="right" size={16} /></a>
            </div>
            <ul className="bookmark-strip">
              {recentBookmarks.map(chapter => (
                <li key={chapter.n}>
                  <a href={`#/read/${chapterId(chapter.n)}`}>
                    <span>第 {chapter.n} 章</span>
                    <strong>{chapter.title}</strong>
                  </a>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section className="home-note">
          <h2>关于这个站点</h2>
          <p>
            单书、纯静态、无广告。进度和书签只存在本机，换设备请用书架里的导出/导入。
            原文缺失章节会明确标注，不补写、不改号。
          </p>
          <p className="home-note-links">
            <a href="#/about">文本来源与缺失清单</a>
            <span>·</span>
            <a href="#/settings">阅读设置</a>
          </p>
        </section>
      </main>
    </div>
  )
}
