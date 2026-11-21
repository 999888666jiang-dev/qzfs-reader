export function formatChars(chars) {
  if (!chars) return '0 字'
  if (chars >= 10000) return `${(chars / 10000).toFixed(1)} 万字`
  return `${chars} 字`
}

export function formatCount(value) {
  return Number(value || 0).toLocaleString('zh-CN')
}

export function formatDate(timestamp) {
  if (!timestamp) return ''
  return new Date(timestamp).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

export function chapterLabel(n, title) {
  const clean = (title || '').trim()
  return clean ? `第 ${n} 章 ${clean}` : `第 ${n} 章`
}

export function highlightParts(text, query) {
  const source = String(text || '')
  const needle = String(query || '').trim()
  if (!needle) return [{ text: source, match: false }]
  const lower = source.toLowerCase()
  const target = needle.toLowerCase()
  const parts = []
  let cursor = 0
  let index = lower.indexOf(target)
  while (index !== -1) {
    if (index > cursor) parts.push({ text: source.slice(cursor, index), match: false })
    parts.push({ text: source.slice(index, index + needle.length), match: true })
    cursor = index + needle.length
    index = lower.indexOf(target, cursor)
  }
  if (cursor < source.length) parts.push({ text: source.slice(cursor), match: false })
  return parts
}
