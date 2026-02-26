import { useTheme } from '../hooks/useTheme.js'
import { IconSun, IconMoon, IconMonitor } from './Icons.jsx'

export function ThemeToggle() {
  const [theme, setTheme] = useTheme()
  const cycle = () => setTheme({ system: 'light', light: 'dark', dark: 'system' }[theme])
  const label = { system: 'Sistema', light: 'Claro', dark: 'Oscuro' }
  return (
    <button
      type="button"
      onClick={cycle}
      className="p-2 rounded-xl border border-border bg-surface text-text-muted hover:text-primary min-h-[44px] min-w-[44px] flex items-center justify-center touch-manipulation transition-colors"
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
