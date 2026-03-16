import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Spinner, PageHeader, EntityDetailPage } from '@tools/shared'
import { usePlannerApi } from '../contexts/PlannerApiContext'

const HABITS_QUERY = `
  query { habits { id name description frequency lastModified } }
`

export function HabitDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { graphql } = usePlannerApi()
  const [habit, setHabit] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await graphql(HABITS_QUERY)
      const list = data?.habits ?? []
      setHabit(list.find((h) => h.id === id) ?? null)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [graphql, id])

  useEffect(() => {
    load()
  }, [load])

  if (loading && !habit) {
    return (
      <div className="flex flex-col items-center gap-4 py-12">
        <Spinner />
        <p className="text-text-muted">Loading habit…</p>
      </div>
    )
  }

  if (!habit) {
    return (
      <EntityDetailPage header={<PageHeader title="Habit" onBack={() => navigate('/habits')} />}>
        <p className="text-text-muted">{error || 'Habit not found.'}</p>
      </EntityDetailPage>
    )
  }

  return (
    <EntityDetailPage header={<PageHeader title={habit.name || 'Habit'} onBack={() => navigate('/habits')} />}>
      {error && <p className="text-red-600 dark:text-red-400 text-sm mb-4" role="alert">{error}</p>}
      <dl className="space-y-2 text-sm">
        {habit.description && <><dt className="text-text-muted">Description</dt><dd className="whitespace-pre-wrap">{habit.description}</dd></>}
        {habit.frequency && <><dt className="text-text-muted">Frequency</dt><dd>{habit.frequency}</dd></>}
      </dl>
    </EntityDetailPage>
  )
}
