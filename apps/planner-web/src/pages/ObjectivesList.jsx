import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Spinner, PageHeader, Card, CardList, EntityListPage, IconTarget } from '@tools/shared'
import { usePlannerApi } from '../contexts/PlannerApiContext'

const OBJECTIVES_QUERY = `
  query { objectives { id objectiveName status description category priority startDate targetDate lastModified } }
`

export function ObjectivesList() {
  const navigate = useNavigate()
  const { graphql } = usePlannerApi()
  const [objectives, setObjectives] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await graphql(OBJECTIVES_QUERY)
      setObjectives(data?.objectives ?? [])
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
      header={<PageHeader title="Objectives" onRefresh={load} loading={loading} />}
      showEmptyState={!loading && objectives.length === 0}
      emptyState={<p className="text-text-muted text-center py-8">No objectives yet.</p>}
    >
      {error && <p className="text-red-600 dark:text-red-400 text-sm mb-4" role="alert">{error}</p>}
      {loading && objectives.length === 0 ? (
        <div className="flex justify-center py-8"><Spinner /></div>
      ) : (
        <CardList>
          {objectives.map((o) => (
            <Card
              key={o.id}
              title={o.objectiveName || '(untitled)'}
              icon={<IconTarget size={20} />}
              onClick={() => navigate(`/objectives/${o.id}`)}
              className="cursor-pointer"
            >
              {o.description && <p className="text-sm text-text-muted line-clamp-2">{o.description}</p>}
              <div className="flex flex-wrap gap-2 mt-2">
                {o.status && <span className="text-xs px-2 py-0.5 rounded bg-primary-muted">{o.status}</span>}
                {o.targetDate && <span className="text-xs text-text-muted">Target: {o.targetDate}</span>}
              </div>
            </Card>
          ))}
        </CardList>
      )}
    </EntityListPage>
  )
}
