import { Link, useLocation } from 'react-router-dom'
import { ThemeToggle } from './ThemeToggle'
import { useAuth } from '../contexts/AuthContext'

const nav = [
  { to: '/', label: 'Dashboard' },
  { to: '/objectives', label: 'Objetivos' },
  { to: '/key-results', label: 'Key Results' },
  { to: '/tasks', label: 'Tareas' },
  { to: '/habits', label: 'Hábitos' },
  { to: '/analysis/okr', label: 'Análisis OKR' },
  { to: '/analysis/tasks', label: 'Análisis Tareas' },
  { to: '/analysis/habits', label: 'Análisis Hábitos' },
]

export function AppShell({ children }) {
  const location = useLocation()
  const { logout } = useAuth()

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-slate-900">
      <header className="sticky top-0 z-10 border-b border-gray-200 dark:border-slate-700 bg-white/95 dark:bg-slate-800/95 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <Link to="/" className="text-lg font-semibold text-gray-800 dark:text-gray-100">
            Personal Planner
          </Link>
          <nav className="flex flex-wrap items-center gap-1">
            {nav.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className={`min-h-[44px] min-w-[44px] inline-flex items-center justify-center px-3 py-2 rounded-xl text-base font-medium touch-manipulation ${
                  location.pathname === to || (to !== '/' && location.pathname.startsWith(to))
                    ? 'bg-sky-100 dark:bg-sky-900/50 text-sky-800 dark:text-sky-200'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700'
                }`}
              >
                {label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              type="button"
              onClick={logout}
              className="px-4 py-2 text-base rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 min-h-[44px] touch-manipulation"
            >
              Salir
            </button>
          </div>
        </div>
      </header>
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6 pb-10">
        {children}
      </main>
    </div>
  )
}
