import { useTheme } from '../hooks/useTheme'

export function ThemeToggle() {
  const [theme, setTheme] = useTheme()

  const cycle = () => {
    const next = { system: 'light', light: 'dark', dark: 'system' }
    setTheme(next[theme])
  }

  const label = { system: 'Sistema', light: 'Claro', dark: 'Oscuro' }

  return (
    <button
      type="button"
      onClick={cycle}
      className="p-2 rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-base text-gray-700 dark:text-gray-300 min-h-[44px] min-w-[44px] touch-manipulation"
      title={`Tema: ${label[theme]}`}
      aria-label={`Tema actual: ${label[theme]}. Cambiar.`}
    >
      <span className="sr-only">{label[theme]}</span>
      {theme === 'dark' && '🌙'}
      {theme === 'light' && '☀️'}
      {theme === 'system' && '◐'}
    </button>
  )
}
