import { useEffect, useState } from 'react'
import { parseTheme, resolveTheme, THEME_KEY, type ThemePreference } from './theme'
function readTheme(): ThemePreference {
  try {
    return parseTheme(localStorage.getItem(THEME_KEY))
  } catch {
    return 'system'
  }
}
export function useTheme() {
  const [preference, updatePreference] = useState(readTheme)
  const [systemDark, setSystemDark] = useState(
    () => matchMedia('(prefers-color-scheme: dark)').matches,
  )
  const [notice, setNotice] = useState('')
  const dark = resolveTheme(preference, systemDark)
  useEffect(() => {
    const media = matchMedia('(prefers-color-scheme: dark)')
    function change(event: MediaQueryListEvent) {
      setSystemDark(event.matches)
    }
    function sync(event: StorageEvent) {
      if (event.key === THEME_KEY || event.key === null) updatePreference(readTheme())
    }
    media.addEventListener('change', change)
    window.addEventListener('storage', sync)
    return () => {
      media.removeEventListener('change', change)
      window.removeEventListener('storage', sync)
    }
  }, [])
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', dark ? '#131e19' : '#f8faf7')
  }, [dark])
  function setPreference(value: ThemePreference) {
    updatePreference(value)
    try {
      localStorage.setItem(THEME_KEY, value)
      setNotice('')
    } catch {
      setNotice('主题已切换，但浏览器未能记住选择，刷新后可能恢复。')
    }
  }
  return {
    preference,
    dark,
    notice,
    setPreference,
    toggle: () => setPreference(dark ? 'light' : 'dark'),
  }
}
export type ThemeStore = ReturnType<typeof useTheme>
