import { useAuth } from '../contexts/AuthContext.jsx'
import { useTheme } from '../hooks/useTheme.js'
import { LoginScreen } from './LoginScreen.jsx'
import { Spinner } from './Spinner.jsx'

export function Layout({ children }) {
  useTheme() // apply stored theme to <html> on load (no UI here)
  const { isAuthenticated, isChecking } = useAuth()
  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Spinner />
          <p className="text-base font-bold text-text-muted">Loading…</p>
        </div>
      </div>
    )
  }
  if (!isAuthenticated) return <LoginScreen />
  return <div className="min-h-screen bg-background">{children}</div>
}
