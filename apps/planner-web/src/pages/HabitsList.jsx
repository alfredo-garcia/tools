import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Spinner, PageHeader, Card, CardList, EntityListPage, IconCircle } from '@tools/shared'
import { usePlannerApi } from '../contexts/PlannerApiContext'

const HABITS_QUERY = `
  query { habits { id name description frequency lastModified } }
`

export function HabitsList() {
  const navigate = useNavigate()
  const { graphql } = usePlannerApi()
  const [habits, setHabits] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await graphql(HABITS_QUERY)
      setHabits(data?.habits ?? [])
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
      header={<PageHeader title="Habits" onRefresh={load} loading={loading} />}
      showEmptyState={!loading && habits.length === 0}
      emptyState={
        <p className="text-text-muted text-center py-8">No habits yet.</p>
      }
    >
      {error && (
        <p className="text-red-600 dark:text-red-400 text-sm mb-4" role="alert">{error}</p>
      )}
      {loading && habits.length === 0 ? (
        <div className="flex justify-center py-8"><Spinner /></div>
      ) : (
        <CardList>
          {habits.map((h) => (
            <Card
              key={h.id}
              title={h.name || h.id}
              icon={<IconCircle size={20} />}
              className="cursor-pointer"
              onClick={() => navigate(`/habits/${h.id}`)}
            >
              {h.description && <p className="text-sm text-text-muted line-clamp-2">{h.description}</p>}
              {h.frequency && <span className="text-xs text-text-muted">{h.frequency}</span>}
            </Card>
          ))}
        </CardList>
      )}
    </EntityListPage>
  )
}
