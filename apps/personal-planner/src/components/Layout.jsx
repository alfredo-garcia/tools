import { useAuth } from '../contexts/AuthContext'
import { LoginScreen } from './LoginScreen'

export function Layout({ children }) {
  const { isAuthenticated, isChecking } = useAuth()

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" aria-hidden />
          <p className="text-base text-gray-600 dark:text-gray-400">Cargando…</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <LoginScreen />
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      {children}
    </div>
  )
}
