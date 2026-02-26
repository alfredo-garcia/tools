import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useApi } from '../lib/api'
import { Spinner } from '../components/Spinner'
import { PageHeader } from '../components/PageHeader'
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

  const refetch = useCallback(() => {
    setLoading(true)
    setError(null)
    fetchApi('/api/tasks')
      .then((r) => setTasks(r.data || []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [fetchApi])

  useEffect(() => {
    refetch()
  }, [refetch])

  if (loading && tasks.length === 0) return <div className="flex justify-center py-12"><Spinner size="lg" /></div>
  if (error && tasks.length === 0) return <p className="text-red-600 dark:text-red-400">{error}</p>

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
    color: ['#f97316', '#22c55e', '#737373', '#a3a3a3'][i % 4],
  }))

  return (
    <div className="space-y-8">
      <PageHeader title="Análisis Tareas / TODOs" onRefresh={refetch} loading={loading} />

      <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-2 border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5">
          <h2 className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Tareas completadas (total)</h2>
          <p className="text-2xl font-bold text-neutral-900 dark:text-white">{completionPct}%</p>
          <p className="text-sm text-neutral-600 dark:text-neutral-300">{done.length} / {total}</p>
        </div>
        <div className="rounded-2xl border border-2 border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5">
          <h2 className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Por estado</h2>
          <p className="text-lg font-bold text-neutral-900 dark:text-white">{Object.keys(byStatus).length} estados</p>
        </div>
      </section>

      {weekData.length > 0 && (
        <section className="rounded-2xl border border-2 border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5">
          <h2 className="text-base font-semibold text-neutral-800 dark:text-white mb-4">
            Cumplimiento por semana (últimas 8)
          </h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={weekData} margin={{ left: 8, right: 20 }}>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
              <Tooltip formatter={(v) => [`${v}%`, 'Completadas']} />
              <Bar dataKey="pct" fill="#f97316" radius={[4, 4, 0, 0]} name="Completadas %" />
            </BarChart>
          </ResponsiveContainer>
        </section>
      )}

      {statusPie.length > 0 && (
        <section className="rounded-2xl border border-2 border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5">
          <h2 className="text-base font-semibold text-neutral-800 dark:text-white mb-4">
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
        <h2 className="text-base font-semibold text-neutral-800 dark:text-white mb-3">
          <Link to="/tasks" className="text-orange-500 dark:text-orange-400 hover:underline">
            Ver todas las tareas →
          </Link>
        </h2>
      </section>
    </div>
  )
}
