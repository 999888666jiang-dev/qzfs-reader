import { useEffect, useMemo, useRef, useState } from 'react'
import Icon from './Icon'

const ROW_HEIGHT = 44
const OVERSCAN = 12
const WINDOW_ROWS = 90

export default function ChapterList({ chapters, currentN, bookmarks, onSelect }) {
  const [query, setQuery] = useState('')
  const [scrollTop, setScrollTop] = useState(0)
  const scrollRef = useRef(null)
  const bookmarkSet = useMemo(() => new Set(bookmarks || []), [bookmarks])

  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase()
    if (!keyword) return chapters
    return chapters
      .filter(chapter => String(chapter.n).includes(keyword) || chapter.title.toLowerCase().includes(keyword))
      .slice(0, 300)
  }, [chapters, query])

  const virtual = !query.trim()
  const start = virtual ? Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN) : 0
  const end = virtual ? Math.min(filtered.length, start + WINDOW_ROWS) : filtered.length
  const visible = filtered.slice(start, end)

  useEffect(() => {
    setScrollTop(0)
    if (scrollRef.current) scrollRef.current.scrollTop = 0
  }, [query])

  useEffect(() => {
    if (query.trim() || !scrollRef.current) return
    const index = chapters.findIndex(chapter => chapter.n === currentN)
    if (index >= 0) {
      scrollRef.current.scrollTop = Math.max(0, (index - 6) * ROW_HEIGHT)
      setScrollTop(scrollRef.current.scrollTop)
    }
  }, [chapters, currentN, query])

  function handleScroll(event) {
    setScrollTop(event.currentTarget.scrollTop)
  }

  return (
    <div className="chapter-list">
      <label className="search-field">
        <Icon name="search" size={18} />
        <input
          type="search"
          value={query}
          onChange={event => setQuery(event.target.value)}
          placeholder="搜章节号或标题，如 12 / 世界"
          aria-label="搜索目录"
        />
      </label>
      <div className="chapter-list-meta">
        {query.trim() ? `找到 ${filtered.length} 条` : `共 ${chapters.length} 章 · 缺章保留号位`}
      </div>
      <div className="chapter-list-scroll" ref={scrollRef} onScroll={handleScroll}>
        {virtual ? <div style={{ height: start * ROW_HEIGHT }} aria-hidden="true" /> : null}
        {visible.length ? (
          <ul className="chapter-rows">
            {visible.map(chapter => {
              const missing = chapter.status === 1
              const active = chapter.n === currentN
              return (
                <li key={chapter.n}>
                  <button
                    type="button"
                    className={`chapter-row${active ? ' is-current' : ''}${missing ? ' is-missing' : ''}`}
                    onClick={() => onSelect(chapter.n)}
                    aria-current={active ? 'true' : undefined}
                  >
                    <span className="chapter-row-n">{chapter.n}</span>
                    <span className="chapter-row-title">{chapter.title || `第 ${chapter.n} 章`}</span>
                    {bookmarkSet.has(chapter.id) ? <Icon name="bookmark" size={14} filled className="row-icon" /> : null}
                    {missing ? <span className="badge badge--muted">缺</span> : null}
                  </button>
                </li>
              )
            })}
          </ul>
        ) : (
          <p className="empty-text">没有找到相关章节。</p>
        )}
        {virtual ? <div style={{ height: (filtered.length - end) * ROW_HEIGHT }} aria-hidden="true" /> : null}
      </div>
    </div>
  )
}
