import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext.jsx'

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
      setError('Enter your access code.')
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
          setError('API not found. Is the API server running? If you use another port (e.g. 3009), restart Vite with: API_PORT=3009 npm run dev')
          return
        }
        setError(data.error ?? 'Incorrect code.')
        return
      }
      login(code.trim())
    } catch (err) {
      setError('Connection error. Check your network.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="bg-background"
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '380px',
          flexShrink: 0,
        }}
      >
        <div
          className="rounded-2xl border-2 border-border bg-surface"
          style={{
            padding: '32px 28px',
            boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
          }}
        >
          <h1
            className="text-text font-bold"
            style={{ fontSize: '1.5rem', marginBottom: '8px', textAlign: 'center' }}
          >
            Private access
          </h1>
          <p
            className="text-text-muted font-medium"
            style={{ fontSize: '0.9375rem', marginBottom: '28px', textAlign: 'center' }}
          >
            Enter your access code
          </p>
          <form
            onSubmit={handleSubmit}
            style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
          >
            <label htmlFor="access-code" className="sr-only">
              Access code
            </label>
            <input
              id="access-code"
              type="password"
              autoComplete="current-password"
              placeholder="Code (alphanumeric)"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full rounded-xl border-2 border-border bg-background text-text placeholder-text-muted focus:ring-2 focus:ring-primary focus:border-primary outline-none"
              style={{
                padding: '14px 16px',
                fontSize: '1rem',
                boxSizing: 'border-box',
              }}
              disabled={loading}
              autoFocus
            />
            {error && (
              <p
                className="text-red-600 dark:text-red-400 font-medium"
                style={{ fontSize: '0.875rem', textAlign: 'center', margin: 0 }}
                role="alert"
              >
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-primary hover:bg-primary-hover text-white font-bold disabled:opacity-60 touch-manipulation transition-colors outline-none border-0"
              style={{
                padding: '14px 16px',
                fontSize: '1rem',
                minHeight: '48px',
                boxSizing: 'border-box',
              }}
            >
              {loading ? 'Checking…' : 'Sign in'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
