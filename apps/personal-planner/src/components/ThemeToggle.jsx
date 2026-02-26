import { useTheme } from '../hooks/useTheme'
import { IconSun, IconMoon, IconMonitor } from './Icons'

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
      className="p-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 hover:text-orange-500 dark:hover:text-orange-400 min-h-[44px] min-w-[44px] flex items-center justify-center touch-manipulation transition-colors"
      title={`Tema: ${label[theme]}`}
      aria-label={`Tema actual: ${label[theme]}. Cambiar.`}
    >
      <span className="sr-only">{label[theme]}</span>
      {theme === 'dark' && <IconMoon size={22} />}
      {theme === 'light' && <IconSun size={22} />}
      {theme === 'system' && <IconMonitor size={22} />}
    </button>
  )
}
