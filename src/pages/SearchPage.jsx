import { useEffect, useMemo, useState } from 'react'
import { useCatalog } from '../hooks/useCatalog'
import { navigate } from '../router'
import { chapterId } from '../lib/chapters'
import { formatChars, highlightParts } from '../lib/format'
import Icon from '../components/Icon'

export default function SearchPage({ route }) {
  const initial = route.query.get('q') || ''
  const [value, setValue] = useState(initial)
  const { status, catalog, error, retry } = useCatalog()

  useEffect(() => {
    setValue(initial)
  }, [initial])

  const query = initial.trim().toLowerCase()
  const results = useMemo(() => {
    if (!catalog || !query) return []
    return catalog.chapters
      .filter(chapter => String(chapter.n).includes(query) || chapter.title.toLowerCase().includes(query))
      .slice(0, 200)
  }, [catalog, query])

  function submit(event) {
    event.preventDefault()
    const next = value.trim()
    navigate(next ? `/search?q=${encodeURIComponent(next)}` : '/search')
  }

  return (
    <div className="page">
      <header className="page-top">
        <a href="#/" className="icon-button" aria-label="返回首页"><Icon name="left" /></a>
        <h1>搜索</h1>
        <a href="#/shelf" className="icon-button" aria-label="书架"><Icon name="bookmarks" /></a>
      </header>

      <main className="page-main">
        <form className="search-form" onSubmit={submit} role="search">
          <label className="search-field search-field--large">
            <Icon name="search" size={20} />
            <input
              type="search"
              value={value}
              onChange={event => setValue(event.target.value)}
              placeholder="章节号或标题，如 12、世界、莫凡"
              aria-label="搜索章节"
              autoFocus
            />
          </label>
          <button type="submit" className="btn btn--primary">搜索</button>
        </form>

        {status === 'error' ? (
          <div className="state-card state-card--error">
            <h2>目录加载失败</h2>
            <p>{error?.message || '请检查网络。'}</p>
            <button type="button" className="btn btn--primary" onClick={retry}>重试</button>
          </div>
        ) : null}

        {!query ? (
          <div className="search-hint">
            <p>输入章节号或标题开始搜索。</p>
            <p className="muted">v1 只搜索章节号与标题，不搜索正文。</p>
          </div>
        ) : (
          <>
            <p className="search-count">
              {status === 'ready' ? `找到 ${results.length} 条${results.length === 200 ? '（仅显示前 200 条）' : ''}` : '正在搜索…'}
            </p>
            {results.length ? (
              <ul className="search-results">
                {results.map(chapter => (
                  <li key={chapter.n}>
                    <a className="search-result" href={`#/read/${chapterId(chapter.n)}`}>
                      <span className="search-result-n">第 {chapter.n} 章</span>
                      <span className="search-result-title">
                        {highlightParts(chapter.title || `第 ${chapter.n} 章`, initial).map((part, index) =>
                          part.match ? <mark key={index}>{part.text}</mark> : <span key={index}>{part.text}</span>,
                        )}
                      </span>
                      <span className="muted">
                        {chapter.status === 1 ? '原文缺失' : formatChars(chapter.chars)}
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="empty-text">{status === 'ready' ? '没有找到相关章节。' : '正在加载目录…'}</p>
            )}
          </>
        )}
      </main>
    </div>
  )
}
