import { KEYS, readJson, writeJson } from './storage'

export const THEMES = [
  { id: 'paper', label: '纸白', dot: '#f6f1e7' },
  { id: 'sepia', label: '羊皮纸', dot: '#efe0c8' },
  { id: 'mint', label: '护眼绿', dot: '#e4efdf' },
  { id: 'night', label: '夜间', dot: '#171a21' },
  { id: 'oled', label: '纯黑', dot: '#000000' },
  { id: 'arcane', label: '魔法夜', dot: '#0d1424' },
]

export const FONTS = [
  { id: 'serif', label: '宋体' },
  { id: 'sans', label: '黑体' },
  { id: 'system', label: '系统' },
]

export const PAGE_WIDTHS = [
  { id: 'narrow', label: '窄', value: '34em' },
  { id: 'medium', label: '中', value: '42em' },
  { id: 'wide', label: '宽', value: '52em' },
  { id: 'full', label: '全宽', value: '100%' },
]

export const DEFAULT_SETTINGS = {
  version: 1,
  theme: 'paper',
  fontSize: 0,
  fontFamily: 'serif',
  lineHeight: 1.85,
  paragraphGap: 0.9,
  pageWidth: 'medium',
  justify: false,
  showProgress: true,
  reduceMotion: 'auto',
}

export function deviceDefaultFontSize() {
  if (typeof window === 'undefined') return 20
  return window.matchMedia('(max-width: 767px)').matches ? 18 : 20
}

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

export function normalizeSettings(raw = {}) {
  const settings = { ...DEFAULT_SETTINGS, ...raw }
  if (!THEMES.some(theme => theme.id === settings.theme)) settings.theme = 'paper'
  if (!FONTS.some(font => font.id === settings.fontFamily)) settings.fontFamily = 'serif'
  if (!PAGE_WIDTHS.some(width => width.id === settings.pageWidth)) settings.pageWidth = 'medium'
  settings.fontSize = Math.round(clamp(Number(settings.fontSize) || deviceDefaultFontSize(), 14, 32))
  settings.lineHeight = clamp(Number(settings.lineHeight) || 1.85, 1.5, 2.2)
  settings.paragraphGap = clamp(Number(settings.paragraphGap) || 0.9, 0, 1.5)
  settings.justify = Boolean(settings.justify)
  settings.showProgress = settings.showProgress !== false
  settings.reduceMotion = ['auto', 'on', 'off'].includes(settings.reduceMotion)
    ? settings.reduceMotion
    : 'auto'
  settings.version = 1
  return settings
}

export function loadSettings() {
  const saved = readJson(KEYS.settings, null)
  return normalizeSettings(saved || {})
}

export function saveSettings(settings) {
  return writeJson(KEYS.settings, settings)
}

export function applySettings(settings) {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  const width = PAGE_WIDTHS.find(item => item.id === settings.pageWidth) || PAGE_WIDTHS[1]
  root.dataset.theme = settings.theme
  root.dataset.font = settings.fontFamily
  root.dataset.justify = settings.justify ? 'true' : 'false'
  root.style.setProperty('--reader-font-size', `${settings.fontSize}px`)
  root.style.setProperty('--reader-line-height', String(settings.lineHeight))
  root.style.setProperty('--reader-para-gap', `${settings.paragraphGap}em`)
  root.style.setProperty('--reader-max-width', width.value)
}
