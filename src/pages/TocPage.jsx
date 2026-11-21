import { useMemo } from 'react'
import { useCatalog } from '../hooks/useCatalog'
import { navigate } from '../router'
import { chapterId } from '../lib/chapters'
import { loadBookmarks } from '../lib/storage'
import ChapterList from '../components/ChapterList'
import Icon from '../components/Icon'

export default function TocPage() {
  const { status, catalog, error, retry } = useCatalog()
  const bookmarks = useMemo(() => loadBookmarks(), [])

  if (status === 'error') {
    return (
      <div className="page">
        <header className="page-top">
          <a href="#/" className="icon-button" aria-label="返回首页"><Icon name="left" /></a>
          <h1>目录</h1>
          <span />
        </header>
        <main className="page-main">
          <div className="state-card state-card--error">
            <h2>目录加载失败</h2>
            <p>{error?.message || '请检查网络。'}</p>
            <button type="button" className="btn btn--primary" onClick={retry}>重试</button>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="page">
      <header className="page-top">
        <a href="#/" className="icon-button" aria-label="返回首页"><Icon name="left" /></a>
        <h1>目录</h1>
        <a href="#/shelf" className="icon-button" aria-label="书架"><Icon name="bookmarks" /></a>
      </header>
      <main className="page-main">
        {status === 'loading' || !catalog ? (
          <p className="muted">正在加载目录…</p>
        ) : (
          <ChapterList
            chapters={catalog.chapters}
            currentN={null}
            bookmarks={bookmarks.items.map(item => item.id)}
            onSelect={n => navigate(`/read/${chapterId(n)}`)}
          />
        )}
      </main>
    </div>
  )
}
