import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useCatalog } from '../hooks/useCatalog'
import { useChapter } from '../hooks/useChapter'
import { useSettings } from '../hooks/useSettings'
import { navigate } from '../router'
import { chapterId, findChapter, neighbors, TOTAL_CHAPTERS } from '../lib/chapters'
import { formatChars } from '../lib/format'
import {
  loadBookmarks,
  loadProgress,
  recordCurrent,
  recordPosition,
  toggleBookmark,
} from '../lib/storage'
import ChapterList from '../components/ChapterList'
import Drawer from '../components/Drawer'
import Icon from '../components/Icon'
import SettingsPanel from '../components/SettingsPanel'

export default function ReaderPage({ route, onToast }) {
  const n = route.n
  const { status: catalogStatus, catalog, error: catalogError, retry: retryCatalog } = useCatalog()
  const chapterState = useChapter(n)
  const { settings, update, reset } = useSettings()
  const [tocOpen, setTocOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [bookmarks, setBookmarks] = useState(() => loadBookmarks())
  const [, setProgressTick] = useState(0)
  const restoredRef = useRef(null)
  const touchRef = useRef(null)
  const saveTimerRef = useRef(null)

  const entry = useMemo(
    () => (catalog ? findChapter(catalog.chapters, n) : null),
    [catalog, n],
  )
  const missing = entry?.status === 1 || chapterState.chapter?.missing === true
  const title = chapterState.chapter?.title || entry?.title || ''
  const chapterNumber = chapterState.chapter?.n || n
  const total = catalog?.chapters.length || TOTAL_CHAPTERS
  const prev = neighbors(n, total).prev
  const next = neighbors(n, total).next
  const bookmarked = bookmarks.items.some(item => item.id === chapterId(n))
  const progressPercent = Math.min(100, Math.max(0, (n / total) * 100))

  const toast = useCallback(message => onToast?.(message), [onToast])

  const goTo = useCallback(
    target => {
      if (!target) {
        toast(n <= 1 ? '已经是第一章' : '已经是最后一章')
        return
      }
      navigate(`/read/${chapterId(target)}`)
    },
    [n, toast],
  )

  useEffect(() => {
    if (catalog && entry) {
      recordCurrent(chapterId(n))
      setProgressTick(value => value + 1)
    }
  }, [catalog, entry, n])

  useLayoutEffect(() => {
    if (chapterState.status !== 'ready' || restoredRef.current === n) return undefined
    restoredRef.current = n
    const ratio = loadProgress().positions[chapterId(n)] ?? 0
    const frame = requestAnimationFrame(() => {
      if (missing) {
        window.scrollTo({ top: 0 })
        return
      }
      const max = Math.max(0, document.documentElement.scrollHeight - window.innerHeight)
      window.scrollTo({ top: max * ratio })
    })
    return () => cancelAnimationFrame(frame)
  }, [n, chapterState.status, missing])

  useEffect(() => {
    if (chapterState.status !== 'ready') return undefined
    const save = () => {
      const max = Math.max(0, document.documentElement.scrollHeight - window.innerHeight)
      const ratio = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0
      recordPosition(chapterId(n), ratio)
      setProgressTick(value => value + 1)
    }
    const onScroll = () => {
      if (saveTimerRef.current) return
      saveTimerRef.current = window.setTimeout(() => {
        saveTimerRef.current = null
        save()
      }, 400)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current)
      saveTimerRef.current = null
      save()
    }
  }, [n, chapterState.status])

  useEffect(() => {
    const onKeyDown = event => {
      const target = event.target
      if (target instanceof HTMLElement && target.closest('input, textarea, select')) return
      if (event.key === 'Escape') {
        if (tocOpen) setTocOpen(false)
        if (settingsOpen) setSettingsOpen(false)
        return
      }
      if (tocOpen || settingsOpen) return
      if (event.key === 'ArrowLeft') {
        event.preventDefault()
        goTo(prev)
      } else if (event.key === 'ArrowRight') {
        event.preventDefault()
        goTo(next)
      } else if (event.key === 'b' || event.key === 'B') {
        event.preventDefault()
        toggleBookmarkForCurrent()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  })

  function toggleBookmarkForCurrent() {
    const added = toggleBookmark(chapterId(n))
    setBookmarks(loadBookmarks())
    toast(added ? '已加入书签' : '已取消书签')
  }

  function onTouchStart(event) {
    const touch = event.touches[0]
    touchRef.current = { x: touch.clientX, y: touch.clientY }
  }

  function onTouchEnd(event) {
    const start = touchRef.current
    if (!start) return
    const touch = event.changedTouches[0]
    const dx = touch.clientX - start.x
    const dy = touch.clientY - start.y
    touchRef.current = null
    if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 1.5) return
    goTo(dx < 0 ? next : prev)
  }

  function selectFromToc(target) {
    setTocOpen(false)
    if (target !== n) navigate(`/read/${chapterId(target)}`)
  }

  if (catalogStatus === 'error') {
    return (
      <div className="reader-state">
        <div className="state-card state-card--error">
          <h1>目录加载失败</h1>
          <p>{catalogError?.message || '请检查网络后重试。'}</p>
          <button type="button" className="btn btn--primary" onClick={retryCatalog}>重试</button>
        </div>
      </div>
    )
  }

  if (catalogStatus === 'loading' || !catalog) {
    return (
      <div className="reader-state">
        <div className="reader-skeleton" aria-label="正在加载">
          <div className="skeleton-line skeleton-line--title" />
          <div className="skeleton-line" />
          <div className="skeleton-line" />
          <div className="skeleton-line skeleton-line--short" />
        </div>
      </div>
    )
  }

  if (!entry) {
    return (
      <div className="reader-state">
        <div className="state-card">
          <h1>章节不存在</h1>
          <p>这个章节号不在 1–{total} 范围内。</p>
          <a className="btn btn--primary" href="#/">返回首页</a>
        </div>
      </div>
    )
  }

  return (
    <div className={`reader${missing ? ' is-missing' : ''}`}>
      <header className="reader-top">
        <a className="icon-button" href="#/" aria-label="返回首页">
          <Icon name="left" />
        </a>
        <div className="reader-heading">
          <span className="reader-kicker">第 {n} 章</span>
          <h1>{title || `第 ${n} 章`}</h1>
        </div>
        <div className="reader-actions">
          <button
            type="button"
            className={`icon-button${bookmarked ? ' is-active' : ''}`}
            onClick={toggleBookmarkForCurrent}
            aria-label={bookmarked ? '取消书签' : '添加书签'}
            aria-pressed={bookmarked}
          >
            <Icon name="bookmark" filled={bookmarked} />
          </button>
          <button type="button" className="icon-button" onClick={() => setSettingsOpen(true)} aria-label="阅读设置">
            <Icon name="settings" />
          </button>
        </div>
      </header>

      {settings.showProgress ? (
        <div className="reader-progress" role="progressbar" aria-label="全书进度" aria-valuemin="0" aria-valuemax="100" aria-valuenow={Math.round(progressPercent)}>
          <span style={{ width: `${progressPercent}%` }} />
        </div>
      ) : null}

      <main className="reader-main">
        {chapterState.status === 'loading' ? (
          <div className="reader-skeleton" aria-label="正在加载">
            <div className="skeleton-line skeleton-line--title" />
            <div className="skeleton-line" />
            <div className="skeleton-line" />
            <div className="skeleton-line skeleton-line--short" />
          </div>
        ) : chapterState.status === 'error' ? (
          <div className="state-card state-card--error">
            <h2>本章加载失败</h2>
            <p>{chapterState.error?.message || '请稍后重试。'}</p>
            <div className="button-row">
              <button type="button" className="btn btn--primary" onClick={chapterState.retry}>重试</button>
              <button type="button" className="btn btn--ghost" onClick={() => setTocOpen(true)}>返回目录</button>
            </div>
          </div>
        ) : missing ? (
          <section className="missing-card">
            <p className="reader-kicker">第 {n} 章</p>
            <h2>原文缺失</h2>
            <p>这一章暂未收录，先读相邻章节吧。缺失章节不会补写、不会改号。</p>
            <div className="button-row">
              <button type="button" className="btn btn--primary" onClick={() => goTo(prev)}>上一章</button>
              <button type="button" className="btn btn--ghost" onClick={() => goTo(next)}>下一章</button>
            </div>
            <a className="text-link" href="#/about">查看缺失说明</a>
          </section>
        ) : (
          <article
            className="reader-page"
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
          >
            <header className="chapter-head">
              <h1 className="chapter-title">{title || `第 ${n} 章`}</h1>
              <p className="chapter-meta">
                第 {chapterNumber} 章 · {formatChars(chapterState.chapter?.chars || entry.chars)}
              </p>
            </header>
            <div className="reader-body">
              {(chapterState.chapter?.paras || []).map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
            <p className="chapter-end">本章完</p>
          </article>
        )}
      </main>

      <nav className="reader-bottom" aria-label="章节导航">
        <button
          type="button"
          className={`bottom-button${prev ? '' : ' is-disabled'}`}
          onClick={() => goTo(prev)}
          aria-disabled={!prev}
        >
          <Icon name="left" size={18} />
          <span>上一章</span>
        </button>
        <button type="button" className="bottom-button" onClick={() => setTocOpen(true)}>
          <Icon name="list" size={18} />
          <span>目录</span>
        </button>
        <button
          type="button"
          className={`bottom-button${bookmarked ? ' is-active' : ''}`}
          onClick={toggleBookmarkForCurrent}
          aria-pressed={bookmarked}
        >
          <Icon name="bookmark" size={18} filled={bookmarked} />
          <span>{bookmarked ? '已书签' : '书签'}</span>
        </button>
        <button
          type="button"
          className={`bottom-button${next ? '' : ' is-disabled'}`}
          onClick={() => goTo(next)}
          aria-disabled={!next}
        >
          <span>下一章</span>
          <Icon name="right" size={18} />
        </button>
      </nav>

      <Drawer open={tocOpen} title="目录" side="left" onClose={() => setTocOpen(false)} wide>
        <ChapterList
          chapters={catalog.chapters}
          currentN={n}
          bookmarks={bookmarks.items.map(item => item.id)}
          onSelect={selectFromToc}
        />
      </Drawer>

      <Drawer open={settingsOpen} title="阅读设置" side="right" onClose={() => setSettingsOpen(false)}>
        <SettingsPanel settings={settings} onChange={update} onReset={reset} />
      </Drawer>

      <span className="sr-only" aria-live="polite">
        {`第 ${n} 章 ${title || ''}`}
      </span>
    </div>
  )
}
