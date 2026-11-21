import { useEffect, useState } from 'react'
import { loadChapter } from '../lib/dataClient'

export function useChapter(n) {
  const [state, setState] = useState({ status: n ? 'loading' : 'idle', chapter: null, error: null })
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    if (!n) {
      setState({ status: 'idle', chapter: null, error: null })
      return undefined
    }
    let alive = true
    setState(prev => ({ status: prev.chapter?.n === n ? 'ready' : 'loading', chapter: prev.chapter?.n === n ? prev.chapter : null, error: null }))
    loadChapter(n)
      .then(chapter => {
        if (alive) setState({ status: 'ready', chapter, error: null })
      })
      .catch(error => {
        if (alive) setState({ status: 'error', chapter: null, error })
      })
    return () => {
      alive = false
    }
  }, [n, reloadKey])

  return { ...state, retry: () => setReloadKey(value => value + 1) }
}
