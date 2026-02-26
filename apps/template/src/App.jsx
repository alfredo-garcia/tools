import { Layout } from './components/Layout'
import { ThemeToggle } from './components/ThemeToggle'
import { Spinner } from './components/Spinner'
import { useAuth } from './contexts/AuthContext'
import { useApi } from './lib/api'
import { useState, useEffect } from 'react'

function Dashboard() {
  const { logout } = useAuth()
  const { fetchApi } = useApi()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    fetchApi('/api/data')
      .then((res) => {
        if (!cancelled) setData(res.data)
      })
      .catch((err) => {
        if (!cancelled) setError(err.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [fetchApi])

  return (
    <div className="min-h-screen p-4 pb-8">
      <header className="flex items-center justify-between gap-4 mb-6">
        <h1 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
          Micro App
        </h1>
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
      </header>

      <main className="max-w-2xl mx-auto">
        <section className="rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6">
          <h2 className="text-base font-medium text-gray-700 dark:text-gray-300 mb-4">
            Datos de ejemplo (Airtable)
          </h2>
          {loading && (
            <div className="flex items-center gap-3 py-8">
              <Spinner size="md" />
              <span className="text-base text-gray-600 dark:text-gray-400">
                Cargando…
              </span>
            </div>
          )}
          {error && (
            <p className="text-base text-red-600 dark:text-red-400 py-4" role="alert">
              {error}
            </p>
          )}
          {!loading && !error && data && (
            <ul className="space-y-2 text-base text-gray-800 dark:text-gray-200">
              {data.length === 0 ? (
                <li className="text-gray-500 dark:text-gray-400">
                  No hay registros. Configura AIRTABLE_* en .env.
                </li>
              ) : (
                data.slice(0, 10).map((row) => (
                  <li key={row.id} className="py-2 border-b border-gray-100 dark:border-slate-700 last:border-0">
                    <pre className="text-sm overflow-x-auto whitespace-pre-wrap">
                      {JSON.stringify(row, null, 0)}
                    </pre>
                  </li>
                ))
              )}
            </ul>
          )}
        </section>
      </main>
    </div>
  )
}

function App() {
  return (
    <Layout>
      <Dashboard />
    </Layout>
  )
}

export default App
