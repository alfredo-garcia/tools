import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useApi } from '../lib/api'
import { Spinner } from '../components/Spinner'
import { PageHeader } from '../components/PageHeader'
import { field, num, str, arr, dateStr } from '../lib/normalize'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'

const STATUS_DONE = ['Done', 'Complete', 'Completado', 'Hecho', 'Cerrado']
const weekStart = (d) => {
  const x = new Date(d)
  const day = x.getDay()
  const diff = x.getDate() - day + (day === 0 ? -6 : 1)
  x.setDate(diff)
  x.setHours(0, 0, 0, 0)
  return x
}
const isThisWeek = (dateStr) => {
  if (!dateStr) return false
  const d = new Date(dateStr)
  const w = weekStart(new Date())
  const wEnd = new Date(w)
  wEnd.setDate(wEnd.getDate() + 6)
  return d >= w && d <= wEnd
}

function useDashboardData() {
  const { fetchApi } = useApi()
  const [data, setData] = useState({
    objectives: [],
    keyResults: [],
    tasks: [],
    habits: [],
    habitTracking: [],
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const refetch = useCallback(() => {
    setLoading(true)
    setError(null)
    Promise.all([
      fetchApi('/api/objectives').then((r) => r.data),
      fetchApi('/api/key-results').then((r) => r.data),
      fetchApi('/api/tasks').then((r) => r.data),
      fetchApi('/api/habits').then((r) => r.data),
      fetchApi('/api/habit-tracking').then((r) => r.data),
    ])
      .then(([objectives, keyResults, tasks, habits, habitTracking]) => {
        setData({ objectives, keyResults, tasks, habits, habitTracking })
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [fetchApi])

  useEffect(() => {
    refetch()
  }, [refetch])

  return { data, loading, error, refetch }
}

function KpiCard({ title, value, subtitle, to }) {
  return (
    <Link
      to={to || '#'}
      className={`rounded-2xl border border-2 border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 shadow-sm hover:shadow-md transition-shadow ${
        to ? 'cursor-pointer' : 'cursor-default'
      }`}
    >
      <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">{title}</p>
      <p className="mt-1 text-2xl font-bold text-neutral-900 dark:text-white">{value}</p>
      {subtitle != null && (
        <p className="mt-0.5 text-sm text-neutral-600 dark:text-neutral-300">{subtitle}</p>
      )}
    </Link>
  )
}

export function Dashboard() {
  const { data, loading, error, refetch } = useDashboardData()

  if (loading && !data.objectives?.length) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    )
  }
  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-6">
        <p className="text-red-700 dark:text-red-300">{error}</p>
      </div>
    )
  }

  const { objectives, keyResults, tasks, habits, habitTracking } = data

  const krProgress = keyResults.map((kr) => {
    const p = num(field(kr, 'Progress (%)', 'Progress', 'Progress %')) ?? 0
    return typeof p === 'number' ? p : parseFloat(p) || 0
  })
  const okrPct =
    krProgress.length === 0
      ? 0
      : Math.round(
          krProgress.reduce((a, b) => a + b, 0) / krProgress.length
        )
  const krDone = keyResults.filter((kr) =>
    STATUS_DONE.includes(str(field(kr, 'Status', 'status')))
  ).length
  const krTotal = keyResults.length
  const krPct = krTotal === 0 ? 0 : Math.round((krDone / krTotal) * 100)

  const weekTasks = tasks.filter((t) => isThisWeek(dateStr(field(t, 'Due Date', 'Due Date'))))
  const weekTasksDone = weekTasks.filter((t) =>
    STATUS_DONE.includes(str(field(t, 'Status', 'status')))
  )
  const todosPct =
    weekTasks.length === 0 ? 0 : Math.round((weekTasksDone.length / weekTasks.length) * 100)

  const thisWeekTracking = habitTracking.filter((t) =>
    isThisWeek(dateStr(field(t, 'Execution Date-Time', 'Execution Date-Time', 'Execution Date')))
  )
  const habitSuccess = thisWeekTracking.filter((t) => {
    const v = field(t, 'Was Successful?', 'Was Successful')
    return v === true || str(v).toLowerCase() === 'yes' || str(v) === '1'
  }).length
  const habitsPct =
    thisWeekTracking.length === 0
      ? 0
      : Math.round((habitSuccess / thisWeekTracking.length) * 100)

  const okrChartData = keyResults.slice(0, 8).map((kr) => ({
    name: str(field(kr, 'Key Result Name', 'Key Result Name')).slice(0, 12) || 'KR',
    progress: num(field(kr, 'Progress (%)', 'Progress', 'Progress %')) ?? 0,
  }))
  const statusPie = [
    { name: 'Completadas', value: weekTasksDone.length, color: '#f97316' },
    { name: 'Pendientes', value: weekTasks.length - weekTasksDone.length, color: '#737373' },
  ].filter((d) => d.value > 0)

  return (
    <div className="space-y-8">
      <PageHeader title="Dashboard" onRefresh={refetch} loading={loading} />

      <section>
        <h2 className="text-base font-semibold text-neutral-700 dark:text-neutral-300 mb-4">
          Resumen de cumplimiento
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            title="OKR (media KR)"
            value={`${okrPct}%`}
            subtitle={`${objectives.length} objetivos, ${keyResults.length} key results`}
            to="/analysis/okr"
          />
          <KpiCard
            title="Key Results"
            value={`${krPct}%`}
            subtitle={`${krDone} / ${krTotal} completados`}
            to="/key-results"
          />
          <KpiCard
            title="Todos semanales"
            value={`${todosPct}%`}
            subtitle={`${weekTasksDone.length} / ${weekTasks.length} esta semana`}
            to="/analysis/tasks"
          />
          <KpiCard
            title="Hábitos (esta semana)"
            value={`${habitsPct}%`}
            subtitle={`${habitSuccess} / ${thisWeekTracking.length} registros exitosos`}
            to="/analysis/habits"
          />
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-2 border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5">
          <h3 className="text-base font-semibold text-neutral-800 dark:text-white mb-4">
            Progreso Key Results (top 8)
          </h3>
          {okrChartData.length === 0 ? (
            <p className="text-neutral-500 dark:text-neutral-400 text-sm">Sin datos</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={okrChartData} layout="vertical" margin={{ left: 4, right: 20 }}>
                <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v) => [`${v}%`, 'Progreso']} />
                <Bar dataKey="progress" fill="#f97316" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
        <div className="rounded-2xl border border-2 border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5">
          <h3 className="text-base font-semibold text-neutral-800 dark:text-white mb-4">
            Tareas esta semana
          </h3>
          {statusPie.length === 0 ? (
            <p className="text-neutral-500 dark:text-neutral-400 text-sm">Sin tareas esta semana</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={statusPie}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
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
          )}
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          to="/objectives"
          className="rounded-2xl border border-2 border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 hover:shadow-md transition-shadow"
        >
          <h3 className="text-base font-semibold text-neutral-800 dark:text-white">
            Objetivos recientes
          </h3>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            {objectives.length} objetivos · Ver todos
          </p>
          <ul className="mt-3 space-y-1">
            {objectives.slice(0, 3).map((o) => (
              <li key={o.id} className="text-sm text-neutral-700 dark:text-neutral-300 truncate">
                {str(field(o, 'Objective Name', 'Objective Name')) || '(sin nombre)'}
              </li>
            ))}
          </ul>
        </Link>
        <Link
          to="/habits"
          className="rounded-2xl border border-2 border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 hover:shadow-md transition-shadow"
        >
          <h3 className="text-base font-semibold text-neutral-800 dark:text-white">Hábitos</h3>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            {habits.length} hábitos · Ver todos
          </p>
          <ul className="mt-3 space-y-1">
            {habits.slice(0, 3).map((h) => (
              <li key={h.id} className="text-sm text-neutral-700 dark:text-neutral-300 truncate">
                {str(field(h, 'Habit Name', 'Habit Name')) || '(sin nombre)'}
              </li>
            ))}
          </ul>
        </Link>
      </section>
    </div>
  )
}
