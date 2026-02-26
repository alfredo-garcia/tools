import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useApi } from '../lib/api'
import { Spinner } from '../components/Spinner'
import { field, str, dateStr } from '../lib/normalize'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'

const STATUS_DONE = ['Done', 'Complete', 'Completado', 'Hecho', 'Cerrado']

function weekKey(d) {
  const x = new Date(d)
  const day = x.getDay()
  const diff = x.getDate() - day + (day === 0 ? -6 : 1)
  x.setDate(diff)
  return x.toISOString().slice(0, 10)
}

export function AnalysisTasks() {
  const { fetchApi } = useApi()
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    fetchApi('/api/tasks')
      .then((r) => {
        if (!cancelled) setTasks(r.data || [])
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

  const done = tasks.filter((t) => STATUS_DONE.includes(str(field(t, 'Status', 'Status'))))
  const total = tasks.length
  const completionPct = total === 0 ? 0 : Math.round((done.length / total) * 100)

  const byWeek = {}
  tasks.forEach((t) => {
    const due = dateStr(field(t, 'Due Date', 'Due Date'))
    if (!due) return
    const w = weekKey(due)
    if (!byWeek[w]) byWeek[w] = { week: w, total: 0, done: 0 }
    byWeek[w].total += 1
    if (STATUS_DONE.includes(str(field(t, 'Status', 'Status')))) byWeek[w].done += 1
  })
  const weekData = Object.values(byWeek)
    .sort((a, b) => a.week.localeCompare(b.week))
    .slice(-8)
    .map((x) => ({ ...x, name: x.week, pct: x.total ? Math.round((x.done / x.total) * 100) : 0 }))

  const byStatus = {}
  tasks.forEach((t) => {
    const s = str(field(t, 'Status', 'Status')) || 'Sin estado'
    byStatus[s] = (byStatus[s] || 0) + 1
  })
  const statusPie = Object.entries(byStatus).map(([name, value], i) => ({
    name,
    value,
    color: ['#0ea5e9', '#22c55e', '#94a3b8', '#e2e8f0'][i % 4],
  }))

  return (
    <div className="space-y-8">
      <h1 className="text-xl font-bold text-gray-900 dark:text-white">Análisis Tareas / TODOs</h1>

      <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5">
          <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400">Tareas completadas (total)</h2>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{completionPct}%</p>
          <p className="text-sm text-gray-600 dark:text-gray-300">{done.length} / {total}</p>
        </div>
        <div className="rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5">
          <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400">Por estado</h2>
          <p className="text-lg font-bold text-gray-900 dark:text-white">{Object.keys(byStatus).length} estados</p>
        </div>
      </section>

      {weekData.length > 0 && (
        <section className="rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5">
          <h2 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-4">
            Cumplimiento por semana (últimas 8)
          </h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={weekData} margin={{ left: 8, right: 20 }}>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
              <Tooltip formatter={(v) => [`${v}%`, 'Completadas']} />
              <Bar dataKey="pct" fill="#0ea5e9" radius={[4, 4, 0, 0]} name="Completadas %" />
            </BarChart>
          </ResponsiveContainer>
        </section>
      )}

      {statusPie.length > 0 && (
        <section className="rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5">
          <h2 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-4">
            Distribución por estado
          </h2>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={statusPie}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={90}
                paddingAngle={2}
                dataKey="value"
                nameKey="name"
                label={({ name, value }) => `${name}: ${value}`}
              >
                {statusPie.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </section>
      )}

      <section>
        <h2 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-3">
          <Link to="/tasks" className="text-sky-600 dark:text-sky-400 hover:underline">
            Ver todas las tareas →
          </Link>
        </h2>
      </section>
    </div>
  )
}
