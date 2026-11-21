import { useEffect, useState } from 'react'

const ROUTE_NAMES = new Set(['home', 'reader', 'toc', 'shelf', 'search', 'settings', 'about'])

export function parseRoute(hash = window.location.hash) {
  const raw = (hash || '#/').replace(/^#/, '') || '/'
  const [pathPart, queryPart = ''] = raw.split('?')
  const path = pathPart.startsWith('/') ? pathPart : `/${pathPart}`
  const query = new URLSearchParams(queryPart)
  const parts = path.split('/').filter(Boolean)

  if (!parts.length) return { name: 'home', path, query }
  if (parts[0] === 'read' && parts[1] && /^c\d{4}$/.test(parts[1])) {
    return { name: 'reader', id: parts[1], n: Number(parts[1].slice(1)), path, query }
  }
  if (ROUTE_NAMES.has(parts[0]) && parts.length === 1) {
    return { name: parts[0], path, query }
  }
  return { name: 'notFound', path, query }
}

export function navigate(to) {
  if (!to) return
  const next = to.startsWith('#') ? to : `#${to.startsWith('/') ? '' : '/'}${to}`
  if (window.location.hash === next) return
  window.location.hash = next
}

export function href(to) {
  return `#${to.startsWith('/') ? '' : '/'}${to}`
}

export function useRoute() {
  const [route, setRoute] = useState(() => parseRoute())
  useEffect(() => {
    const onChange = () => setRoute(parseRoute())
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])
  return route
}
