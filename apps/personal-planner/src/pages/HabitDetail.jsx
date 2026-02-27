import { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useApi, Spinner, PageHeader } from '@tools/shared'
import { field, str, dateStr } from '@tools/shared'

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
  if (!habit) return <p className="text-text-muted">Hábito no encontrado.</p>

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
      <Link to="/habits" className="text-sm text-primary hover:underline">
        ← Volver a Hábitos
      </Link>
      <PageHeader breadcrumbs={[{ label: 'Home', to: '/' }, { label: 'Hábitos', to: '/habits' }, { label: title }]} onRefresh={refetch} loading={loading} />
      <div className="rounded-2xl border border-2 border-border bg-surface overflow-hidden">
        <div className="p-6 border-b border-border">
          <dl className="grid gap-2 sm:grid-cols-2">
            {rows.map(([label, value]) =>
              value ? (
                <div key={label}>
                  <dt className="text-sm text-text-muted">{label}</dt>
                  <dd className="text-text">{value}</dd>
                </div>
              ) : null
            )}
          </dl>
          <div className="mt-4 p-3 rounded-xl bg-surface">
            <span className="text-sm text-text-muted">Tasa de éxito (registros)</span>
            <p className="text-lg font-bold text-text">{successPct}%</p>
            <p className="text-sm text-text-muted">{successCount} / {tracking.length} exitosos</p>
          </div>
        </div>
        <div className="p-6">
          <h2 className="text-base font-semibold text-text mb-3">
            Historial reciente
          </h2>
          <ul className="space-y-2 max-h-64 overflow-y-auto">
            {tracking.slice(0, 30).map((t) => {
              const success = field(t, 'Was Successful?', 'Was Successful')
              const ok = success === true || String(success).toLowerCase() === 'yes' || success === '1'
              const dt = dateStr(field(t, 'Execution Date-Time', 'Execution Date-Time', 'Execution Date'))
              return (
                <li key={t.id} className="flex items-center gap-2 text-sm">
                  <span className={ok ? 'text-green-600 dark:text-green-400' : 'text-text-muted'}>
                    {ok ? '✓' : '○'}
                  </span>
                  <span className="text-text-muted">{dt}</span>
                </li>
              )
            })}
          </ul>
          {tracking.length === 0 && (
            <p className="text-sm text-text-muted">Sin registros aún.</p>
          )}
        </div>
      </div>
    </div>
  )
}
