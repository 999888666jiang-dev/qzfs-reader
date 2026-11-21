export const TOTAL_CHAPTERS = 3233

export function chapterId(n) {
  return `c${String(n).padStart(4, '0')}`
}

export function nFromId(id) {
  if (!/^c\d{4}$/.test(String(id || ''))) return null
  const n = Number(String(id).slice(1))
  return Number.isInteger(n) && n >= 1 && n <= TOTAL_CHAPTERS ? n : null
}

export function findChapter(chapters, n) {
  return chapters?.find(chapter => chapter.n === n) || null
}

export function isMissing(chapter) {
  return !chapter || chapter.status === 1 || chapter.missing === true
}

export function neighbors(n, total = TOTAL_CHAPTERS) {
  return {
    prev: n > 1 ? n - 1 : null,
    next: n < total ? n + 1 : null,
  }
}

export function nearestAvailable(n, chapters, total = TOTAL_CHAPTERS) {
  const map = new Map((chapters || []).map(chapter => [chapter.n, chapter]))
  const start = Math.min(Math.max(Number(n) || 1, 1), total)
  if (map.get(start)?.status === 0) return start
  for (let delta = 1; delta < total; delta += 1) {
    const forward = start + delta
    if (forward <= total && map.get(forward)?.status === 0) return forward
    const backward = start - delta
    if (backward >= 1 && map.get(backward)?.status === 0) return backward
  }
  return 1
}
