import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useApi, Spinner, PageHeader } from '@tools/shared'
import { field, num, str, arr } from '../lib/normalize'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

const STATUS_DONE = ['Done', 'Complete', 'Completado', 'Hecho', 'Cerrado']

export function AnalysisOKR() {
  const { fetchApi } = useApi()
  const [objectives, setObjectives] = useState([])
  const [keyResults, setKeyResults] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const refetch = useCallback(() => {
    setLoading(true)
    setError(null)
    Promise.all([
      fetchApi('/api/objectives').then((r) => r.data),
      fetchApi('/api/key-results').then((r) => r.data),
    ])
      .then(([obj, kr]) => {
        setObjectives(obj || [])
        setKeyResults(kr || [])
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [fetchApi])

  useEffect(() => {
    refetch()
  }, [refetch])

  if (loading && objectives.length === 0) return <div className="flex justify-center py-12"><Spinner size="lg" /></div>
  if (error && objectives.length === 0) return <p className="text-red-600 dark:text-red-400">{error}</p>

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

  const colors = ['#f97316', '#fb923c', '#fdba74', '#fed7aa']

  return (
    <div className="space-y-8">
      <PageHeader breadcrumbs={[{ label: 'Home', to: '/' }, { label: 'Análisis OKR', to: '/analysis/okr' }]} onRefresh={refetch} loading={loading} />

      <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-2 border-border bg-surface p-5">
          <h2 className="text-sm font-medium text-text-muted">Progreso medio (Key Results)</h2>
          <p className="text-2xl font-bold text-text">{overallAvg}%</p>
        </div>
        <div className="rounded-2xl border border-2 border-border bg-surface p-5">
          <h2 className="text-sm font-medium text-text-muted">Key Results completados</h2>
          <p className="text-2xl font-bold text-text">
            {completedKR} / {keyResults.length}
          </p>
        </div>
      </section>

      <section className="rounded-2xl border border-2 border-border bg-surface p-5">
        <h2 className="text-base font-semibold text-text mb-4">
          Progreso por objetivo (media de sus Key Results)
        </h2>
        {krByObjective.length === 0 ? (
          <p className="text-text-muted text-sm">Sin datos para mostrar.</p>
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
        <h2 className="text-base font-semibold text-text mb-3">
          Objetivos y sus Key Results
        </h2>
        <ul className="space-y-3">
          {krByObjective.map((o) => (
            <li key={o.id}>
              <Link
                to={`/objectives/${o.id}`}
                className="block rounded-xl border border-2 border-border bg-surface p-4 hover:shadow-md"
              >
                <span className="font-medium text-text">{o.name}</span>
                <div className="mt-2 flex items-center gap-4 text-sm text-text-muted">
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
