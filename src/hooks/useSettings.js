import { useEffect, useState } from 'react'
import { loadSettings, applySettings, saveSettings, normalizeSettings } from '../lib/settings'

export function useSettings() {
  const [settings, setSettings] = useState(() => loadSettings())

  useEffect(() => {
    applySettings(settings)
    saveSettings(settings)
  }, [settings])

  function update(patch) {
    setSettings(prev => normalizeSettings({ ...prev, ...patch }))
  }

  function reset() {
    setSettings(normalizeSettings({ ...loadSettings(), ...defaultPatch() }))
  }

  return { settings, update, reset }
}

function defaultPatch() {
  return {
    theme: 'paper',
    fontFamily: 'serif',
    lineHeight: 1.85,
    paragraphGap: 0.9,
    pageWidth: 'medium',
    justify: false,
    showProgress: true,
    fontSize: 0,
    reduceMotion: 'auto',
  }
}
