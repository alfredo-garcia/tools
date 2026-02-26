import { Link } from 'react-router-dom'
import { ThemeToggle } from '../components/ThemeToggle'
import { useAuth } from '../contexts/AuthContext'

export function Settings() {
  const { logout } = useAuth()

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-neutral-900 dark:text-white">Ajustes</h1>
      <div className="rounded-2xl border-2 border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-neutral-800 dark:text-white">Apariencia</h2>
            <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Tema claro u oscuro</p>
          </div>
          <ThemeToggle />
        </div>
        <hr className="border-neutral-200 dark:border-neutral-800" />
        <div>
          <h2 className="text-base font-bold text-neutral-800 dark:text-white mb-2">Sesión</h2>
          <button
            type="button"
            onClick={logout}
            className="min-h-[44px] px-4 py-2 rounded-xl border-2 border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 font-bold hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            Cerrar sesión
          </button>
        </div>
      </div>
      <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
        <Link to="/" className="text-orange-500 hover:text-orange-600 dark:text-orange-400 dark:hover:text-orange-300 underline">← Volver al inicio</Link>
      </p>
    </div>
  )
}
