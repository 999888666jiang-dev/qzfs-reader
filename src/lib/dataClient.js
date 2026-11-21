import { chapterId } from './chapters'

const DATA_BASE = new URL('data/', document.baseURI)
const CHAPTER_CACHE_LIMIT = 24
const chapterCache = new Map()
let catalogPromise = null

async function fetchJson(name) {
  const response = await fetch(new URL(name, DATA_BASE), { credentials: 'same-origin' })
  if (!response.ok) throw new Error(`${name} HTTP ${response.status}`)
  return response.json()
}

export function loadCatalog({ force = false } = {}) {
  if (force) catalogPromise = null
  if (!catalogPromise) {
    catalogPromise = Promise.all([fetchJson('meta.json'), fetchJson('catalog.json')])
      .then(([meta, catalog]) => ({
        meta,
        catalog: {
          ...catalog,
          chapters: catalog.chapters.map(([n, title, chars, status]) => ({
            n,
            title,
            chars,
            status,
            id: chapterId(n),
          })),
        },
      }))
      .catch(error => {
        catalogPromise = null
        throw error
      })
  }
  return catalogPromise
}

export async function loadChapter(n) {
  const key = Number(n)
  if (chapterCache.has(key)) return chapterCache.get(key)
  const payload = await fetchJson(`chapters/${chapterId(key)}.json`)
  chapterCache.set(key, payload)
  while (chapterCache.size > CHAPTER_CACHE_LIMIT) {
    chapterCache.delete(chapterCache.keys().next().value)
  }
  return payload
}

export function cacheChapter(n, payload) {
  chapterCache.set(Number(n), payload)
}

export function clearChapterCache() {
  chapterCache.clear()
}
