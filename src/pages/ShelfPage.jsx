import { useMemo, useRef, useState } from 'react'
import { useCatalog } from '../hooks/useCatalog'
import { chapterId, findChapter, nearestAvailable } from '../lib/chapters'
import { formatChars, formatDate } from '../lib/format'
import {
  clearAll,
  exportBackup,
  importBackup,
  loadBookmarks,
  loadProgress,
  toggleBookmark,
} from '../lib/storage'
import Icon from '../components/Icon'

export default function ShelfPage() {
  const { catalog, meta, status, error, retry } = useCatalog()
  const [version, setVersion] = useState(0)
  const [message, setMessage] = useState('')
  const fileRef = useRef(null)
  const progress = useMemo(() => loadProgress(), [version])
  const bookmarks = useMemo(() => loadBookmarks(), [version])

  const currentChapter = useMemo(() => {
    if (!catalog) return null
    const target = progress.current ? Number(progress.current.slice(1)) : 1
    return findChapter(catalog.chapters, nearestAvailable(target, catalog.chapters))
  }, [catalog, progress.current])

  const bookmarkChapters = useMemo(() => {
    if (!catalog) return []
    return bookmarks.items
      .map(item => ({ item, chapter: findChapter(catalog.chapters, Number(item.id.slice(1))) }))
      .filter(entry => entry.chapter)
  }, [bookmarks, catalog])

  const historyChapters = useMemo(() => {
    if (!catalog) return []
    return progress.history
      .map(id => findChapter(catalog.chapters, Number(id.slice(1))))
      .filter(Boolean)
      .slice(0, 12)
  }, [progress.history, catalog])

  function refresh(text) {
    setVersion(value => value + 1)
    if (text) setMessage(text)
  }

  function removeBookmark(id) {
    toggleBookmark(id)
    refresh('已移除书签')
  }

  function exportData() {
    const payload = exportBackup()
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `qfs-backup-${new Date().toISOString().slice(0, 10)}.json`
    anchor.click()
    URL.revokeObjectURL(url)
    setMessage('备份已导出')
  }

  async function importData(event) {
    const file = event.target.files?.[0]
    if (!file) return
    try {
      const text = await file.text()
      importBackup(JSON.parse(text))
      refresh('备份已导入')
    } catch (importError) {
      setMessage(`导入失败：${importError.message}`)
    } finally {
      event.target.value = ''
    }
  }

  function clearData() {
    if (!window.confirm('清空本机的设置、进度和书签？此操作不可撤销。')) return
    clearAll()
    refresh('本地数据已清空')
  }

  return (
    <div className="page">
      <header className="page-top">
        <a href="#/" className="icon-button" aria-label="返回首页"><Icon name="left" /></a>
        <h1>书架</h1>
        <a href="#/settings" className="icon-button" aria-label="阅读设置"><Icon name="settings" /></a>
      </header>

      <main className="page-main">
        {message ? <p className="inline-note" role="status">{message}</p> : null}

        {status === 'error' ? (
          <div className="state-card state-card--error">
            <h2>目录加载失败</h2>
            <p>{error?.message || '请检查网络。'}</p>
            <button type="button" className="btn btn--primary" onClick={retry}>重试</button>
          </div>
        ) : null}

        <section className="shelf-hero">
          <p className="section-kicker">继续阅读</p>
          <h2>{currentChapter ? `第 ${currentChapter.n} 章` : '第 1 章'}</h2>
          <p>{currentChapter?.title || '世界大变'}</p>
          <a className="btn btn--primary" href={currentChapter ? `#/read/${chapterId(currentChapter.n)}` : '#/read/c0001'}>
            打开这一章
          </a>
        </section>

        <section className="shelf-section">
          <div className="section-head">
            <h2>书签 <span className="muted">（{bookmarkChapters.length}）</span></h2>
            <a href="#/search">去找章节 <Icon name="right" size={16} /></a>
          </div>
          {bookmarkChapters.length ? (
            <ul className="shelf-list">
              {bookmarkChapters.map(({ item, chapter }) => (
                <li key={item.id}>
                  <a href={`#/read/${chapterId(chapter.n)}`} className="shelf-row">
                    <span className="shelf-n">{chapter.n}</span>
                    <span className="shelf-title">{chapter.title}</span>
                    <span className="muted">{formatChars(chapter.chars)}</span>
                  </a>
                  <button type="button" className="text-button" onClick={() => removeBookmark(item.id)}>移除</button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="empty-text">还没有书签。在阅读页点右上角书签图标即可添加。</p>
          )}
        </section>

        <section className="shelf-section">
          <div className="section-head"><h2>最近阅读</h2></div>
          {historyChapters.length ? (
            <ul className="shelf-list">
              {historyChapters.map(chapter => (
                <li key={chapter.n}>
                  <a href={`#/read/${chapterId(chapter.n)}`} className="shelf-row">
                    <span className="shelf-n">{chapter.n}</span>
                    <span className="shelf-title">{chapter.title}</span>
                    <span className="muted">{meta ? formatDate(progress.updatedAt) : ''}</span>
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="empty-text">读过的章节会出现在这里。</p>
          )}
        </section>

        <section className="shelf-section">
          <div className="section-head"><h2>数据管理</h2></div>
          <p className="muted">
            设置、进度和书签只存在本机。换设备时导出 JSON，在新设备导入即可恢复。
          </p>
          <div className="button-row">
            <button type="button" className="btn btn--ghost" onClick={exportData}>
              <Icon name="download" size={17} /> 导出备份
            </button>
            <button type="button" className="btn btn--ghost" onClick={() => fileRef.current?.click()}>
              <Icon name="upload" size={17} /> 导入备份
            </button>
            <button type="button" className="btn btn--danger" onClick={clearData}>
              <Icon name="trash" size={17} /> 清空数据
            </button>
          </div>
          <input ref={fileRef} type="file" accept="application/json,.json" className="sr-only" onChange={importData} />
        </section>
      </main>
    </div>
  )
}
