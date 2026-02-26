import { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useApi } from '../lib/api'
import { Spinner } from '../components/Spinner'
import { PageHeader } from '../components/PageHeader'
import { field, str, dateStr } from '../lib/normalize'

export function HabitDetail() {
  const { id } = useParams()
  const { fetchApi } = useApi()
  const [habit, setHabit] = useState(null)
  const [tracking, setTracking] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const refetch = useCallback(() => {
    setLoading(true)
    setError(null)
    Promise.all([
      fetchApi('/api/habits').then((r) => (r.data || []).find((h) => h.id === id)),
      fetchApi('/api/habit-tracking').then((r) => r.data || []),
    ])
      .then(([h, allTracking]) => {
        setHabit(h)
        setTracking(
          (allTracking || []).filter((t) => {
            const link = field(t, 'Habit', 'Habit')
            const arr = Array.isArray(link) ? link : link != null ? [link] : []
            return arr.includes(id)
          })
        )
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [fetchApi, id])

  useEffect(() => {
    refetch()
  }, [refetch])

  if (loading && !habit) return <div className="flex justify-center py-12"><Spinner size="lg" /></div>
  if (error && !habit) return <p className="text-red-600 dark:text-red-400">{error}</p>
  if (!habit) return <p className="text-neutral-500">Hábito no encontrado.</p>

  const successCount = tracking.filter((t) => {
    const v = field(t, 'Was Successful?', 'Was Successful')
    return v === true || String(v).toLowerCase() === 'yes' || v === '1'
  }).length
  const successPct = tracking.length === 0 ? 0 : Math.round((successCount / tracking.length) * 100)

  const rows = [
    ['Descripción', str(field(habit, 'Habit Description', 'Habit Description'))],
    ['Categoría', str(field(habit, 'Category', 'Category'))],
    ['Frecuencia', str(field(habit, 'Frequency', 'Frequency'))],
    ['Prioridad', str(field(habit, 'Priority', 'Priority'))],
  ]

  const title = str(field(habit, 'Habit Name', 'Habit Name')) || 'Hábito'

  return (
    <div className="space-y-6">
      <Link to="/habits" className="text-sm text-orange-500 dark:text-orange-400 hover:underline">
        ← Volver a Hábitos
      </Link>
      <PageHeader title={title} onRefresh={refetch} loading={loading} />
      <div className="rounded-2xl border border-2 border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden">
        <div className="p-6 border-b border-neutral-200 dark:border-neutral-700">
          <dl className="grid gap-2 sm:grid-cols-2">
            {rows.map(([label, value]) =>
              value ? (
                <div key={label}>
                  <dt className="text-sm text-neutral-500 dark:text-neutral-400">{label}</dt>
                  <dd className="text-neutral-900 dark:text-white">{value}</dd>
                </div>
              ) : null
            )}
          </dl>
          <div className="mt-4 p-3 rounded-xl bg-neutral-100 dark:bg-neutral-800/50">
            <span className="text-sm text-neutral-500 dark:text-neutral-400">Tasa de éxito (registros)</span>
            <p className="text-lg font-bold text-neutral-900 dark:text-white">{successPct}%</p>
            <p className="text-sm text-neutral-600 dark:text-neutral-300">{successCount} / {tracking.length} exitosos</p>
          </div>
        </div>
        <div className="p-6">
          <h2 className="text-base font-semibold text-neutral-800 dark:text-white mb-3">
            Historial reciente
          </h2>
          <ul className="space-y-2 max-h-64 overflow-y-auto">
            {tracking.slice(0, 30).map((t) => {
              const success = field(t, 'Was Successful?', 'Was Successful')
              const ok = success === true || String(success).toLowerCase() === 'yes' || success === '1'
              const dt = dateStr(field(t, 'Execution Date-Time', 'Execution Date-Time', 'Execution Date'))
              return (
                <li key={t.id} className="flex items-center gap-2 text-sm">
                  <span className={ok ? 'text-green-600 dark:text-green-400' : 'text-neutral-400'}>
                    {ok ? '✓' : '○'}
                  </span>
                  <span className="text-neutral-600 dark:text-neutral-400">{dt}</span>
                </li>
              )
            })}
          </ul>
          {tracking.length === 0 && (
            <p className="text-sm text-neutral-500 dark:text-neutral-400">Sin registros aún.</p>
          )}
        </div>
      </div>
    </div>
  )
}
