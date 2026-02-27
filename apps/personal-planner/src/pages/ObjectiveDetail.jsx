import { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useApi, Spinner, PageHeader, Card } from '@tools/shared'
import { field, str, dateStr, arr, num } from '@tools/shared'

function KeyResultCard({ kr }) {
  const name = str(field(kr, 'Key Result Name', 'Key Result Name')) || '(untitled)'
  const progress = num(field(kr, 'Progress (%)', 'Progress', 'Progress %')) ?? 0
  const status = str(field(kr, 'Status', 'Status'))

  return (
    <Link to={`/key-results/${kr.id}`} className="block">
      <Card title={name} className="hover:ring-2 hover:ring-primary/30 transition-shadow">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-text-muted">Progress</span>
            <span className="font-medium text-text">{Math.min(100, Math.max(0, progress))}%</span>
          </div>
          <div className="h-2 rounded-full bg-border overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            />
          </div>
          {status && (
            <span className="text-xs text-text-muted">{status}</span>
          )}
        </div>
      </Card>
    </Link>
  )
}

export function ObjectiveDetail() {
  const { id } = useParams()
  const { fetchApi } = useApi()
  const [item, setItem] = useState(null)
  const [keyResults, setKeyResults] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const refetch = useCallback(() => {
    setLoading(true)
    setError(null)
    Promise.all([
      fetchApi('/api/objectives').then((r) => r.data.find((o) => o.id === id) || null),
      fetchApi('/api/key-results').then((r) => r.data),
    ])
      .then(([obj, krs]) => {
        setItem(obj)
        setKeyResults(
          (krs || []).filter((kr) => {
            const link = arr(field(kr, 'Objective Link', 'Objective'))
            return obj && link.includes(obj.id)
          })
        )
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [fetchApi, id])

  useEffect(() => {
    refetch()
  }, [refetch])

  if (loading && !item) return <div className="flex justify-center py-12"><Spinner size="lg" /></div>
  if (error && !item) return <p className="text-red-600 dark:text-red-400">{error}</p>
  if (!item) return <p className="text-text-muted">Objective not found.</p>

  const title = str(field(item, 'Objective Name', 'Objective Name')) || 'Objective'
  const description = str(field(item, 'Description', 'Description'))
  const category = str(field(item, 'Category', 'Category'))
  const status = str(field(item, 'Status', 'Status'))
  const priority = str(field(item, 'Priority', 'Priority'))
  const startDate = dateStr(field(item, 'Start Date', 'Start Date'))
  const targetDate = dateStr(field(item, 'Target Date', 'Target Date'))

  const krProgressList = keyResults.map((kr) => num(field(kr, 'Progress (%)', 'Progress', 'Progress %')) ?? 0)
  const avgProgress = krProgressList.length === 0 ? 0 : Math.round(krProgressList.reduce((a, b) => a + b, 0) / krProgressList.length)

  return (
    <div className="space-y-6">
      <Link to="/objectives" className="text-sm text-primary hover:underline">
        ← Back to OKRs
      </Link>
      <PageHeader breadcrumbs={[{ label: 'Home', to: '/' }, { label: 'OKRs', to: '/objectives' }, { label: title }]} onRefresh={refetch} loading={loading} />

      {/* KPIs */}
      <section className="rounded-2xl bg-surface p-4">
        <h2 className="text-sm font-medium text-text-muted mb-3">KPIs</h2>
        <div className="flex flex-wrap gap-4 items-baseline">
          <span className="text-2xl font-bold text-text">{avgProgress}% progress</span>
          <span className="text-text-muted">Key Results: <strong className="text-text">{keyResults.length}</strong></span>
        </div>
      </section>

      {/* Detalle del objetivo */}
      <div className="rounded-2xl border border-2 border-border bg-surface overflow-hidden">
        <div className="p-6 border-b border-border">
          <h2 className="text-base font-semibold text-text mb-3">Objective</h2>
          {description && (
            <p className="text-text mb-4">{description}</p>
          )}
          <dl className="grid gap-2 sm:grid-cols-2">
            {status && (
              <div>
                <dt className="text-sm text-text-muted">Status</dt>
                <dd className="text-text">{status}</dd>
              </div>
            )}
            {category && (
              <div>
                <dt className="text-sm text-text-muted">Category</dt>
                <dd className="text-text">{category}</dd>
              </div>
            )}
            {priority && (
              <div>
                <dt className="text-sm text-text-muted">Priority</dt>
                <dd className="text-text">{priority}</dd>
              </div>
            )}
            {startDate && (
              <div>
                <dt className="text-sm text-text-muted">Start date</dt>
                <dd className="text-text">{startDate}</dd>
              </div>
            )}
            {targetDate && (
              <div>
                <dt className="text-sm text-text-muted">Target date</dt>
                <dd className="text-text">{targetDate}</dd>
              </div>
            )}
          </dl>
        </div>

        {/* Barra de progreso global (promedio KRs) */}
        {keyResults.length > 0 && (
          <div className="px-6 py-4 border-b border-border">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-text-muted">Overall progress (avg. Key Results)</span>
              <span className="font-medium text-text">{avgProgress}%</span>
            </div>
            <div className="h-3 rounded-full bg-border overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${Math.min(100, Math.max(0, avgProgress))}%` }}
              />
            </div>
          </div>
        )}

        {/* Lista de KRs */}
        {keyResults.length > 0 && (
          <div className="p-6">
            <h2 className="text-base font-semibold text-text mb-3">Key Results</h2>
            <ul className="space-y-2 list-none p-0 m-0">
              {keyResults.map((kr) => (
                <li key={kr.id}>
                  <KeyResultCard kr={kr} />
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {keyResults.length === 0 && (
        <p className="text-text-muted">No key results linked to this objective.</p>
      )}
    </div>
  )
}
