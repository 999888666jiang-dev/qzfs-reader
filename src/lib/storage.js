export const KEYS = {
  settings: 'qfs.settings.v1',
  progress: 'qfs.progress.v1',
  bookmarks: 'qfs.bookmarks.v1',
}

const warnings = []

export function consumeWarnings() {
  return warnings.splice(0)
}

function backup(key, raw) {
  try {
    localStorage.setItem(`qfs.backup.${key}.${Date.now()}`, raw)
  } catch (_) {
    /* ignore quota errors */
  }
}

export function readJson(key, fallback, validate) {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') throw new Error('not an object')
    if (validate && !validate(parsed)) throw new Error('schema mismatch')
    return parsed
  } catch (error) {
    const raw = localStorage.getItem(key)
    if (raw) backup(key, raw)
    warnings.push(`${key}: ${error.message}`)
    try {
      localStorage.removeItem(key)
    } catch (_) {
      /* ignore */
    }
    return fallback
  }
}

export function writeJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch (error) {
    warnings.push(`${key}: ${error.message}`)
    return false
  }
}

export function removeKey(key) {
  try {
    localStorage.removeItem(key)
  } catch (_) {
    /* ignore */
  }
}

export function defaultProgress() {
  return { version: 1, current: null, positions: {}, history: [], updatedAt: 0 }
}

export function loadProgress() {
  const saved = readJson(
    KEYS.progress,
    defaultProgress(),
    value => value.version === 1 && typeof value.positions === 'object',
  )
  return {
    ...defaultProgress(),
    ...saved,
    positions: saved.positions && typeof saved.positions === 'object' ? saved.positions : {},
    history: Array.isArray(saved.history) ? saved.history : [],
  }
}

export function saveProgress(progress) {
  return writeJson(KEYS.progress, { ...progress, version: 1, updatedAt: Date.now() })
}

export function recordPosition(id, ratio) {
  const progress = loadProgress()
  progress.positions[id] = Math.min(1, Math.max(0, Number(ratio) || 0))
  progress.positions = Object.fromEntries(Object.entries(progress.positions).slice(-50))
  return saveProgress(progress)
}

export function recordCurrent(id) {
  const progress = loadProgress()
  progress.current = id
  progress.history = [id, ...progress.history.filter(item => item !== id)].slice(0, 30)
  return saveProgress(progress)
}

export function defaultBookmarks() {
  return { version: 1, items: [] }
}

export function loadBookmarks() {
  const saved = readJson(
    KEYS.bookmarks,
    defaultBookmarks(),
    value => value.version === 1 && Array.isArray(value.items),
  )
  const items = saved.items.filter(item => item && typeof item.id === 'string')
  return { version: 1, items: [...new Map(items.map(item => [item.id, item])).values()] }
}

export function saveBookmarks(bookmarks) {
  return writeJson(KEYS.bookmarks, { version: 1, items: bookmarks.items })
}

export function toggleBookmark(id) {
  const bookmarks = loadBookmarks()
  const exists = bookmarks.items.some(item => item.id === id)
  bookmarks.items = exists
    ? bookmarks.items.filter(item => item.id !== id)
    : [{ id, at: Date.now() }, ...bookmarks.items]
  saveBookmarks(bookmarks)
  return !exists
}

export function isBookmarked(id) {
  return loadBookmarks().items.some(item => item.id === id)
}

export function exportBackup() {
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    settings: readJson(KEYS.settings, null),
    progress: loadProgress(),
    bookmarks: loadBookmarks(),
  }
}

export function importBackup(payload) {
  if (!payload || typeof payload !== 'object') throw new Error('备份格式不正确')
  if (payload.settings) writeJson(KEYS.settings, payload.settings)
  if (payload.progress) saveProgress(payload.progress)
  if (payload.bookmarks) saveBookmarks(payload.bookmarks)
}

export function clearAll() {
  removeKey(KEYS.settings)
  removeKey(KEYS.progress)
  removeKey(KEYS.bookmarks)
}
