import { useState, useEffect, useCallback } from 'react'
import { Spinner, PageHeader, Card, CardList, EntityListPage } from '@tools/shared'
import { usePlannerApi } from '../contexts/PlannerApiContext'

const KEY_RESULTS_QUERY = `
  query { keyResults { id keyResultName status description metric currentValue targetValue unit deadline progressPercent lastModified } }
`

export function KeyResultsList() {
  const { graphql } = usePlannerApi()
  const [keyResults, setKeyResults] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await graphql(KEY_RESULTS_QUERY)
      setKeyResults(data?.keyResults ?? [])
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [graphql])

  useEffect(() => {
    load()
  }, [load])

  return (
    <EntityListPage
      header={<PageHeader title="Key Results" onRefresh={load} loading={loading} />}
      showEmptyState={!loading && keyResults.length === 0}
      emptyState={<p className="text-text-muted text-center py-8">No key results yet.</p>}
    >
      {error && <p className="text-red-600 dark:text-red-400 text-sm mb-4" role="alert">{error}</p>}
      {loading && keyResults.length === 0 ? (
        <div className="flex justify-center py-8"><Spinner /></div>
      ) : (
        <CardList>
          {keyResults.map((kr) => (
            <Card key={kr.id} title={kr.keyResultName || '(untitled)'}>
              {kr.description && <p className="text-sm text-text-muted line-clamp-2">{kr.description}</p>}
              <div className="flex flex-wrap gap-2 mt-2">
                {kr.status && <span className="text-xs px-2 py-0.5 rounded bg-primary-muted">{kr.status}</span>}
                {kr.currentValue != null && kr.targetValue != null && (
                  <span className="text-xs text-text-muted">{kr.currentValue} / {kr.targetValue} {kr.unit || ''}</span>
                )}
              </div>
            </Card>
          ))}
        </CardList>
      )}
    </EntityListPage>
  )
}
