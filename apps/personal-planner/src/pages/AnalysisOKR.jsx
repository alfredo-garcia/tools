import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useApi } from '../lib/api'
import { Spinner } from '../components/Spinner'
import { field, num, str, arr } from '../lib/normalize'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

const STATUS_DONE = ['Done', 'Complete', 'Completado', 'Hecho', 'Cerrado']

export function AnalysisOKR() {
  const { fetchApi } = useApi()
  const [objectives, setObjectives] = useState([])
  const [keyResults, setKeyResults] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    Promise.all([
      fetchApi('/api/objectives').then((r) => r.data),
      fetchApi('/api/key-results').then((r) => r.data),
    ])
      .then(([obj, kr]) => {
        if (!cancelled) {
          setObjectives(obj || [])
          setKeyResults(kr || [])
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

  const krByObjective = objectives.map((o) => {
    const krs = keyResults.filter((kr) => {
      const link = arr(field(kr, 'Objective Link', 'Objective'))
      return link.includes(o.id)
    })
    const progressList = krs.map((kr) => num(field(kr, 'Progress (%)', 'Progress', 'Progress %')) ?? 0)
    const avg = progressList.length ? progressList.reduce((a, b) => a + b, 0) / progressList.length : 0
    const done = krs.filter((kr) => STATUS_DONE.includes(str(field(kr, 'Status', 'Status')))).length
    return {
      id: o.id,
      name: str(field(o, 'Objective Name', 'Objective Name')).slice(0, 20) || 'Objetivo',
      avgProgress: Math.round(avg),
      totalKR: krs.length,
      doneKR: done,
    }
  }).filter((x) => x.totalKR > 0 || x.name !== 'Objetivo')

  const overallAvg =
    keyResults.length === 0
      ? 0
      : Math.round(
          keyResults.reduce((acc, kr) => {
            const p = num(field(kr, 'Progress (%)', 'Progress', 'Progress %')) ?? 0
            return acc + p
          }, 0) / keyResults.length
        )
  const completedKR = keyResults.filter((kr) =>
    STATUS_DONE.includes(str(field(kr, 'Status', 'Status')))
  ).length

  const colors = ['#0ea5e9', '#38bdf8', '#7dd3fc', '#bae6fd']

  return (
    <div className="space-y-8">
      <h1 className="text-xl font-bold text-gray-900 dark:text-white">Análisis OKR</h1>

      <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5">
          <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400">Progreso medio (Key Results)</h2>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{overallAvg}%</p>
        </div>
        <div className="rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5">
          <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400">Key Results completados</h2>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {completedKR} / {keyResults.length}
          </p>
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5">
        <h2 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-4">
          Progreso por objetivo (media de sus Key Results)
        </h2>
        {krByObjective.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-sm">Sin datos para mostrar.</p>
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={krByObjective} margin={{ left: 8, right: 20 }}>
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
              <Tooltip
                formatter={(value) => [`${value}%`, 'Progreso medio']}
                labelFormatter={(_, payload) => payload[0]?.payload?.name}
              />
              <Bar dataKey="avgProgress" radius={[4, 4, 0, 0]}>
                {krByObjective.map((_, i) => (
                  <Cell key={i} fill={colors[i % colors.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </section>

      <section>
        <h2 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-3">
          Objetivos y sus Key Results
        </h2>
        <ul className="space-y-3">
          {krByObjective.map((o) => (
            <li key={o.id}>
              <Link
                to={`/objectives/${o.id}`}
                className="block rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 hover:shadow-md"
              >
                <span className="font-medium text-gray-900 dark:text-white">{o.name}</span>
                <div className="mt-2 flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                  <span>Progreso medio: {o.avgProgress}%</span>
                  <span>KR: {o.doneKR}/{o.totalKR} completados</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
