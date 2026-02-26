import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useApi } from '../lib/api'
import { Spinner } from '../components/Spinner'
import { field, str, dateStr } from '../lib/normalize'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

function weekKey(d) {
  if (!d) return ''
  const x = new Date(d)
  const day = x.getDay()
  const diff = x.getDate() - day + (day === 0 ? -6 : 1)
  x.setDate(diff)
  return x.toISOString().slice(0, 10)
}

function isSuccess(t) {
  const v = field(t, 'Was Successful?', 'Was Successful')
  return v === true || String(v).toLowerCase() === 'yes' || v === '1'
}

export function AnalysisHabits() {
  const { fetchApi } = useApi()
  const [habits, setHabits] = useState([])
  const [tracking, setTracking] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    Promise.all([
      fetchApi('/api/habits').then((r) => r.data),
      fetchApi('/api/habit-tracking').then((r) => r.data),
    ])
      .then(([h, t]) => {
        if (!cancelled) {
          setHabits(h || [])
          setTracking(t || [])
        }
      })
      .catch((e) => {
        if (!cancelled) setError(e.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [fetchApi])

  if (loading) return <div className="flex justify-center py-12"><Spinner size="lg" /></div>
  if (error) return <p className="text-red-600 dark:text-red-400">{error}</p>

  const successTotal = tracking.filter(isSuccess).length
  const totalRecords = tracking.length
  const overallPct = totalRecords === 0 ? 0 : Math.round((successTotal / totalRecords) * 100)

  const byWeek = {}
  tracking.forEach((t) => {
    const d = dateStr(field(t, 'Execution Date-Time', 'Execution Date-Time', 'Execution Date'))
    if (!d) return
    const w = weekKey(d)
    if (!byWeek[w]) byWeek[w] = { week: w, total: 0, success: 0 }
    byWeek[w].total += 1
    if (isSuccess(t)) byWeek[w].success += 1
  })
  const weekData = Object.values(byWeek)
    .sort((a, b) => a.week.localeCompare(b.week))
    .slice(-8)
    .map((x) => ({
      ...x,
      name: x.week,
      pct: x.total ? Math.round((x.success / x.total) * 100) : 0,
    }))

  const habitIds = habits.map((h) => h.id)
  const byHabit = habitIds.map((hid) => {
    const h = habits.find((x) => x.id === hid)
    const records = tracking.filter((t) => {
      const link = field(t, 'Habit', 'Habit')
      const arr = Array.isArray(link) ? link : link != null ? [link] : []
      return arr.includes(hid)
    })
    const success = records.filter(isSuccess).length
    return {
      id: hid,
      name: str(field(h, 'Habit Name', 'Habit Name')).slice(0, 15) || 'Hábito',
      total: records.length,
      success,
      pct: records.length ? Math.round((success / records.length) * 100) : 0,
    }
  }).filter((x) => x.total > 0)

  const colors = ['#0ea5e9', '#22c55e', '#8b5cf6', '#f59e0b']

  return (
    <div className="space-y-8">
      <h1 className="text-xl font-bold text-gray-900 dark:text-white">Análisis Hábitos</h1>

      <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5">
          <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400">Tasa de éxito global</h2>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{overallPct}%</p>
          <p className="text-sm text-gray-600 dark:text-gray-300">{successTotal} / {totalRecords} registros</p>
        </div>
        <div className="rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5">
          <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400">Hábitos con tracking</h2>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{byHabit.length}</p>
          <p className="text-sm text-gray-600 dark:text-gray-300">de {habits.length} hábitos</p>
        </div>
      </section>

      {weekData.length > 0 && (
        <section className="rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5">
          <h2 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-4">
            Éxito por semana (últimas 8)
          </h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={weekData} margin={{ left: 8, right: 20 }}>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
              <Tooltip formatter={(v) => [`${v}%`, 'Éxito']} />
              <Bar dataKey="pct" fill="#22c55e" radius={[4, 4, 0, 0]} name="Éxito %" />
            </BarChart>
          </ResponsiveContainer>
        </section>
      )}

      {byHabit.length > 0 && (
        <section className="rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5">
          <h2 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-4">
            Tasa de éxito por hábito
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={byHabit} layout="vertical" margin={{ left: 4, right: 20 }}>
              <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
              <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 12 }} />
              <Tooltip
                formatter={(v) => [`${v}%`, 'Éxito']}
                labelFormatter={(_, payload) => {
                  const p = payload[0]?.payload
                  return p ? `${p.name} (${p.success}/${p.total})` : ''
                }}
              />
              <Bar dataKey="pct" radius={[0, 4, 4, 0]}>
                {byHabit.map((_, i) => (
                  <Cell key={i} fill={colors[i % colors.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </section>
      )}

      <section>
        <h2 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-3">
          <Link to="/habits" className="text-sky-600 dark:text-sky-400 hover:underline">
            Ver todos los hábitos →
          </Link>
        </h2>
      </section>
    </div>
  )
}
