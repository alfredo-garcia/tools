import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useApi, Spinner, PageHeader } from '@tools/shared'
import { field, num, str, dateStr } from '@tools/shared'

export function KeyResultsList() {
  const { fetchApi } = useApi()
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const refetch = useCallback(() => {
    setLoading(true)
    setError(null)
    fetchApi('/api/key-results')
      .then((r) => setList(r.data || []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [fetchApi])

  useEffect(() => {
    refetch()
  }, [refetch])

  if (loading && list.length === 0) return <div className="flex justify-center py-12"><Spinner size="lg" /></div>
  if (error && list.length === 0) return <p className="text-red-600 dark:text-red-400">{error}</p>

  return (
    <div className="space-y-6">
      <PageHeader breadcrumbs={[{ label: 'Home', to: '/' }, { label: 'Key Results', to: '/key-results' }]} onRefresh={refetch} loading={loading} />
      <ul className="space-y-3">
        {list.map((kr) => {
          const progress = num(field(kr, 'Progress (%)', 'Progress', 'Progress %')) ?? 0
          return (
            <li key={kr.id}>
              <Link
                to={`/key-results/${kr.id}`}
                className="block rounded-xl border border-2 border-border bg-surface p-4 hover:shadow-md transition-shadow"
              >
                <span className="font-medium text-text">
                  {str(field(kr, 'Key Result Name', 'Key Result Name')) || '(untitled)'}
                </span>
                <div className="mt-2 flex items-center gap-3">
                  <div className="flex-1 h-2 rounded-full bg-border overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-text-muted w-12">
                    {progress}%
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 mt-2 text-sm text-text-muted">
                  <span>{str(field(kr, 'Status', 'Status'))}</span>
                  <span>Deadline: {dateStr(field(kr, 'Deadline', 'Deadline')) || '—'}</span>
                </div>
              </Link>
            </li>
          )
        })}
      </ul>
      {list.length === 0 && (
        <p className="text-text-muted">No key results.</p>
      )}
    </div>
  )
}
