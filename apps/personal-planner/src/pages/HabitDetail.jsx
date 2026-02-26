import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useApi } from '../lib/api'
import { Spinner } from '../components/Spinner'
import { field, str, dateStr } from '../lib/normalize'

export function HabitDetail() {
  const { id } = useParams()
  const { fetchApi } = useApi()
  const [habit, setHabit] = useState(null)
  const [tracking, setTracking] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    Promise.all([
      fetchApi('/api/habits').then((r) => (r.data || []).find((h) => h.id === id)),
      fetchApi('/api/habit-tracking').then((r) => r.data || []),
    ])
      .then(([h, allTracking]) => {
        if (!cancelled) {
          setHabit(h)
          const habitIds = [id]
          setTracking(
            allTracking.filter((t) => {
              const link = field(t, 'Habit', 'Habit')
              const arr = Array.isArray(link) ? link : link != null ? [link] : []
              return arr.includes(id)
            })
          )
        }
      })
      .catch((e) => {
        if (!cancelled) setError(e.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [fetchApi, id])

  if (loading) return <div className="flex justify-center py-12"><Spinner size="lg" /></div>
  if (error) return <p className="text-red-600 dark:text-red-400">{error}</p>
  if (!habit) return <p className="text-gray-500">Hábito no encontrado.</p>

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

  return (
    <div className="space-y-6">
      <Link to="/habits" className="text-sm text-sky-600 dark:text-sky-400 hover:underline">
        ← Volver a Hábitos
      </Link>
      <div className="rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden">
        <div className="p-6 border-b border-gray-100 dark:border-slate-700">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            {str(field(habit, 'Habit Name', 'Habit Name')) || '(sin nombre)'}
          </h1>
          <dl className="mt-4 grid gap-2 sm:grid-cols-2">
            {rows.map(([label, value]) =>
              value ? (
                <div key={label}>
                  <dt className="text-sm text-gray-500 dark:text-gray-400">{label}</dt>
                  <dd className="text-gray-900 dark:text-white">{value}</dd>
                </div>
              ) : null
            )}
          </dl>
          <div className="mt-4 p-3 rounded-xl bg-gray-50 dark:bg-slate-700/50">
            <span className="text-sm text-gray-500 dark:text-gray-400">Tasa de éxito (registros)</span>
            <p className="text-lg font-bold text-gray-900 dark:text-white">{successPct}%</p>
            <p className="text-sm text-gray-600 dark:text-gray-300">{successCount} / {tracking.length} exitosos</p>
          </div>
        </div>
        <div className="p-6">
          <h2 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-3">
            Historial reciente
          </h2>
          <ul className="space-y-2 max-h-64 overflow-y-auto">
            {tracking.slice(0, 30).map((t) => {
              const success = field(t, 'Was Successful?', 'Was Successful')
              const ok = success === true || String(success).toLowerCase() === 'yes' || success === '1'
              const dt = dateStr(field(t, 'Execution Date-Time', 'Execution Date-Time', 'Execution Date'))
              return (
                <li key={t.id} className="flex items-center gap-2 text-sm">
                  <span className={ok ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}>
                    {ok ? '✓' : '○'}
                  </span>
                  <span className="text-gray-600 dark:text-gray-400">{dt}</span>
                </li>
              )
            })}
          </ul>
          {tracking.length === 0 && (
            <p className="text-sm text-gray-500 dark:text-gray-400">Sin registros aún.</p>
          )}
        </div>
      </div>
    </div>
  )
}
