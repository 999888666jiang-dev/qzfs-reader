import { useCallback, useEffect, useState } from 'react'
import { useRoute } from './router'
import { consumeWarnings } from './lib/storage'
import Toast from './components/Toast'
import HomePage from './pages/HomePage'
import ReaderPage from './pages/ReaderPage'
import TocPage from './pages/TocPage'
import ShelfPage from './pages/ShelfPage'
import SearchPage from './pages/SearchPage'
import SettingsPage from './pages/SettingsPage'
import AboutPage from './pages/AboutPage'
import NotFoundPage from './pages/NotFoundPage'

export default function App() {
  const route = useRoute()
  const [toast, setToast] = useState('')
  const showToast = useCallback(message => setToast(message), [])

  useEffect(() => {
    const warnings = consumeWarnings()
    if (warnings.length) setToast('本地数据损坏，已重置。')
  }, [route.name])

  useEffect(() => {
    if (route.name !== 'reader') window.scrollTo({ top: 0 })
  }, [route.name, route.path])

  let page
  switch (route.name) {
    case 'reader':
      page = <ReaderPage route={route} onToast={showToast} />
      break
    case 'shelf':
      page = <ShelfPage />
      break
    case 'toc':
      page = <TocPage />
      break
    case 'search':
      page = <SearchPage route={route} />
      break
    case 'settings':
      page = <SettingsPage />
      break
    case 'about':
      page = <AboutPage />
      break
    case 'notFound':
      page = <NotFoundPage />
      break
    default:
      page = <HomePage />
  }

  return (
    <div className="app">
      {page}
      <Toast message={toast} onClose={() => setToast('')} />
    </div>
  )
}
