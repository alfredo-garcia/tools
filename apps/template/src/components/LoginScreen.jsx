import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'

const AUTH_HEADER = 'Authorization'

export function LoginScreen() {
  const { login } = useAuth()
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!code.trim()) {
      setError('Introduce el código de acceso.')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', [AUTH_HEADER]: code.trim() },
        body: JSON.stringify({})
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        if (res.status === 404) {
          setError('API no encontrada. ¿Está el servidor API en marcha? Si usas otro puerto (ej. 3009), cierra Vite y arranca con: API_PORT=3009 npm run dev')
          return
        }
        setError(data.error ?? 'Código incorrecto.')
        return
      }
      login(code.trim())
    } catch (err) {
      setError('Error de conexión. Comprueba la red.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gray-50 dark:bg-slate-900">
      <div className="w-full max-w-sm">
        <h1 className="text-xl font-semibold text-center text-gray-800 dark:text-gray-100 mb-2">
          Acceso privado
        </h1>
        <p className="text-base text-gray-600 dark:text-gray-400 text-center mb-6">
          Introduce tu código de acceso
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="Código"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="w-full px-4 py-3 text-base rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none"
            disabled={loading}
            autoFocus
          />
          {error && (
            <p className="text-sm text-red-600 dark:text-red-400 text-center" role="alert">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 text-base font-medium rounded-xl bg-sky-600 hover:bg-sky-700 text-white disabled:opacity-60 min-h-[48px] touch-manipulation"
          >
            {loading ? 'Comprobando…' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}
