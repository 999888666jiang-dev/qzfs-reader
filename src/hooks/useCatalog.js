import { useCallback, useEffect, useState } from 'react'
import { loadCatalog } from '../lib/dataClient'

export function useCatalog() {
  const [state, setState] = useState({ status: 'loading', meta: null, catalog: null, error: null })
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let alive = true
    setState(prev => ({ ...prev, status: prev.catalog ? 'ready' : 'loading', error: null }))
    loadCatalog({ force: reloadKey > 0 })
      .then(({ meta, catalog }) => {
        if (alive) setState({ status: 'ready', meta, catalog, error: null })
      })
      .catch(error => {
        if (alive) setState({ status: 'error', meta: null, catalog: null, error })
      })
    return () => {
      alive = false
    }
  }, [reloadKey])

  const retry = useCallback(() => setReloadKey(value => value + 1), [])
  return { ...state, retry }
}
