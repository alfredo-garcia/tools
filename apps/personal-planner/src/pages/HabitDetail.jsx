import { useState, useEffect, useCallback, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useApi, Spinner, PageHeader } from '@tools/shared'
import { field, str, dateStr } from '@tools/shared'
import { isThisWeek, isThisMonth, isInLastDays, getTodayStr } from '@tools/shared'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

function isSuccess(t) {
  const v = field(t, 'Was Successful?', 'Was Successful')
  return v === true || String(v).toLowerCase() === 'yes' || v === '1'
}

function getTrackingDate(t) {
  return dateStr(field(t, 'Execution Date-Time', 'Execution Date-Time', 'Execution Date'))?.slice(0, 10) || ''
}

function weekKey(d) {
  if (!d) return ''
  const x = new Date(d)
  const day = x.getDay()
  const diff = x.getDate() - (day === 0 ? -6 : day - 1)
  x.setDate(diff)
  return x.toISOString().slice(0, 10)
}

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

  const last3 = useMemo(() => tracking.filter((t) => isInLastDays(getTrackingDate(t), 3)), [tracking])
  const lastWeek = useMemo(() => tracking.filter((t) => isThisWeek(getTrackingDate(t))), [tracking])
  const lastMonth = useMemo(() => tracking.filter((t) => isThisMonth(getTrackingDate(t))), [tracking])

  const pct3 = last3.length === 0 ? 0 : Math.round((last3.filter(isSuccess).length / last3.length) * 100)
  const pctWeek = lastWeek.length === 0 ? 0 : Math.round((lastWeek.filter(isSuccess).length / lastWeek.length) * 100)
  const pctMonth = lastMonth.length === 0 ? 0 : Math.round((lastMonth.filter(isSuccess).length / lastMonth.length) * 100)

  const barChartData = useMemo(() => {
    const last60 = tracking.filter((t) => {
      const d = getTrackingDate(t)
      return d && isInLastDays(d, 60)
    })
    const byWeek = {}
    last60.forEach((t) => {
      const d = getTrackingDate(t)
      const w = weekKey(d)
      if (!byWeek[w]) byWeek[w] = { week: w, total: 0, success: 0, label: `${d.slice(8, 10)}/${d.slice(5, 7)}` }
      byWeek[w].total += 1
      if (isSuccess(t)) byWeek[w].success += 1
    })
    return Object.values(byWeek)
      .sort((a, b) => a.week.localeCompare(b.week))
      .slice(-8)
      .map((x) => ({
        ...x,
        name: x.week,
        pct: x.total ? Math.round((x.success / x.total) * 100) : 0,
      }))
  }, [tracking])

  if (loading && !habit) return <div className="flex justify-center py-12"><Spinner size="lg" /></div>
  if (error && !habit) return <p className="text-red-600 dark:text-red-400">{error}</p>
  if (!habit) return <p className="text-text-muted">Habit not found.</p>

  const title = str(field(habit, 'Habit Name', 'Habit Name')) || 'Habit'
  const category = str(field(habit, 'Category', 'Category')) || ''

  return (
    <div className="space-y-6">
      <Link to="/habits" className="text-sm text-primary hover:underline">
        ← Volver a hábitos
      </Link>
      <PageHeader breadcrumbs={[{ label: 'Home', to: '/' }, { label: 'Habits', to: '/habits' }, { label: title }]} onRefresh={refetch} loading={loading} />

      <div className="rounded-2xl border border-2 border-border bg-surface overflow-hidden">
        <div className="p-6 border-b border-border">
          <h1 className="text-xl font-bold text-text">{title}</h1>
          {category && (
            <p className="text-sm text-text-muted mt-1">Categoría: {category}</p>
          )}
        </div>

        <div className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-4 border-b border-border">
          <div className="p-4 rounded-xl bg-surface border border-border">
            <p className="text-sm text-text-muted">Últimos 3 días</p>
            <p className="text-2xl font-bold text-text">{pct3}%</p>
            <p className="text-xs text-text-muted">{last3.filter(isSuccess).length} / {last3.length}</p>
          </div>
          <div className="p-4 rounded-xl bg-surface border border-border">
            <p className="text-sm text-text-muted">Esta semana</p>
            <p className="text-2xl font-bold text-text">{pctWeek}%</p>
            <p className="text-xs text-text-muted">{lastWeek.filter(isSuccess).length} / {lastWeek.length}</p>
          </div>
          <div className="p-4 rounded-xl bg-surface border border-border">
            <p className="text-sm text-text-muted">Este mes</p>
            <p className="text-2xl font-bold text-text">{pctMonth}%</p>
            <p className="text-xs text-text-muted">{lastMonth.filter(isSuccess).length} / {lastMonth.length}</p>
          </div>
        </div>

        {barChartData.length > 0 && (
          <div className="p-6">
            <h2 className="text-base font-semibold text-text mb-3">
              Cumplimiento últimos 2 meses (por semana)
            </h2>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={barChartData} margin={{ left: 8, right: 20 }}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} tickFormatter={(v) => v.slice(8, 10) + '/' + v.slice(5, 7)} />
                <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                <Tooltip formatter={(v) => [`${v}%`, 'Cumplimiento']} />
                <Bar dataKey="pct" fill="#f97316" radius={[4, 4, 0, 0]} name="%" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

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
            <p className="text-sm text-text-muted">Aún no hay registros.</p>
          )}
        </div>
      </div>
    </div>
  )
}
