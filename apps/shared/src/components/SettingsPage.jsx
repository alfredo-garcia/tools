import { Link } from 'react-router-dom'
import { ThemeToggle } from './ThemeToggle.jsx'
import { useAuth } from '../contexts/AuthContext.jsx'

/**
 * Bloque de Ajustes: Apariencia (ThemeToggle) + Sesión (logout).
 */
export function SettingsPage({ backTo = '/', backLabel = '← Volver al inicio' }) {
  const { logout } = useAuth()

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-text">Ajustes</h1>
      <div className="rounded-2xl border-2 border-border bg-surface p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-text">Apariencia</h2>
            <p className="text-sm font-medium text-text-muted">Tema claro u oscuro</p>
          </div>
          <ThemeToggle />
        </div>
        <hr className="border-border" />
        <div>
          <h2 className="text-base font-bold text-text mb-2">Sesión</h2>
          <button
            type="button"
            onClick={logout}
            className="min-h-[44px] px-4 py-2 rounded-xl border-2 border-border bg-surface text-text font-bold hover:bg-surface hover:opacity-90 transition-colors"
          >
            Cerrar sesión
          </button>
        </div>
      </div>
      <p className="text-sm font-medium text-text-muted">
        <Link to={backTo} className="text-primary hover:underline">{backLabel}</Link>
      </p>
    </div>
  )
}
