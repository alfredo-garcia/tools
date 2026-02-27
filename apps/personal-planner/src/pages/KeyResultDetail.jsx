import { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useApi, Spinner, PageHeader } from '@tools/shared'
import { field, num, str, dateStr, arr } from '@tools/shared'

export function KeyResultDetail() {
  const { id } = useParams()
  const { fetchApi } = useApi()
  const [item, setItem] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const refetch = useCallback(() => {
    setLoading(true)
    setError(null)
    fetchApi('/api/key-results')
      .then((r) => setItem((r.data || []).find((kr) => kr.id === id) || null))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [fetchApi, id])

  useEffect(() => {
    refetch()
  }, [refetch])

  if (loading && !item) return <div className="flex justify-center py-12"><Spinner size="lg" /></div>
  if (error && !item) return <p className="text-red-600 dark:text-red-400">{error}</p>
  if (!item) return <p className="text-text-muted">Key Result not found.</p>

  const progress = num(field(item, 'Progress (%)', 'Progress', 'Progress %')) ?? 0
  const target = num(field(item, 'Target Value', 'Target Value'))
  const current = num(field(item, 'Current Value', 'Current Value'))
  const rows = [
    ['Description', str(field(item, 'Description', 'Description'))],
    ['Metric', str(field(item, 'Metric', 'Metric'))],
    ['Current value', current != null ? current : str(field(item, 'Current Value', 'Current Value'))],
    ['Target value', target != null ? target : str(field(item, 'Target Value', 'Target Value'))],
    ['Unit', str(field(item, 'Unit', 'Unit'))],
    ['Status', str(field(item, 'Status', 'Status'))],
    ['Deadline', dateStr(field(item, 'Deadline', 'Deadline'))],
  ]

  const title = str(field(item, 'Key Result Name', 'Key Result Name')) || 'Key Result'

  return (
    <div className="space-y-6">
      <Link to="/key-results" className="text-sm text-primary hover:underline">
        ← Back to key results
      </Link>
      <PageHeader breadcrumbs={[{ label: 'Home', to: '/' }, { label: 'Key Results', to: '/key-results' }, { label: title }]} onRefresh={refetch} loading={loading} />
      <div className="rounded-2xl border border-2 border-border bg-surface overflow-hidden">
        <div className="p-6 border-b border-border">
          <div className="mt-2">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-text-muted">Progress</span>
              <span className="font-medium text-text">{progress}%</span>
            </div>
            <div className="h-3 rounded-full bg-border overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
              />
            </div>
          </div>
          <dl className="mt-4 grid gap-2 sm:grid-cols-2">
            {rows.map(([label, value]) =>
              value !== '' && value != null ? (
                <div key={label}>
                  <dt className="text-sm text-text-muted">{label}</dt>
                  <dd className="text-text">{value}</dd>
                </div>
              ) : null
            )}
          </dl>
        </div>
        {(() => {
          const link = arr(field(item, 'Objective Link', 'Objective'))[0]
          if (!link) return null
          return (
            <div className="p-6">
              <h2 className="text-base font-semibold text-text mb-2">
                Linked objective
              </h2>
              <Link to={`/objectives/${link}`} className="text-primary hover:underline">
                View objective →
              </Link>
            </div>
          )
        })()}
      </div>
    </div>
  )
}
