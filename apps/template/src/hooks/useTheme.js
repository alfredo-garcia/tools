import { useState, useEffect } from 'react'

const STORAGE_KEY = 'app_theme'

export function useTheme() {
  const [theme, setThemeState] = useState(() => {
    if (typeof window === 'undefined') return 'system'
    return localStorage.getItem(STORAGE_KEY) || 'system'
  })

  useEffect(() => {
    const root = document.documentElement
    const resolved = theme === 'system'
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : theme
    root.classList.remove('light', 'dark')
    root.classList.add(resolved)
  }, [theme])

  const setTheme = (value) => {
    setThemeState(value)
    if (typeof window !== 'undefined') localStorage.setItem(STORAGE_KEY, value)
  }

  return [theme, setTheme]
}
