import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Spinner, PageHeader, Card, CardList } from '@tools/shared'
import { usePlannerApi } from '../contexts/PlannerApiContext'

const HABITS_QUERY = `
  query { habits { id name description frequency } }
`
const HABIT_TRACKING_QUERY = `
  query { habitTracking { id habitId executionDateTime wasSuccessful } }
`

export function AnalysisHabitsPage() {
  const navigate = useNavigate()
  const { graphql } = usePlannerApi()
  const [habits, setHabits] = useState([])
  const [tracking, setTracking] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [habitsData, trackingData] = await Promise.all([
        graphql(HABITS_QUERY),
        graphql(HABIT_TRACKING_QUERY),
      ])
      setHabits(habitsData?.habits ?? [])
      setTracking(trackingData?.habitTracking ?? [])
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [graphql])

  useEffect(() => {
    load()
  }, [load])

  const entriesByHabit = tracking.reduce((acc, e) => {
    const hid = e.habitId || (Array.isArray(e.Habit) ? e.Habit?.[0] : null)
    if (!hid) return acc
    if (!acc[hid]) acc[hid] = []
    acc[hid].push(e)
    return acc
  }, {})

  const successfulByHabit = Object.fromEntries(
    Object.entries(entriesByHabit).map(([hid, entries]) => [
      hid,
      entries.filter((e) => e.wasSuccessful !== false).length,
    ])
  )

  return (
    <div className="space-y-6">
      <PageHeader title="Habits Analysis" onRefresh={load} loading={loading} onBack={() => navigate('/analytics')} />
      {error && (
        <p className="text-red-600 dark:text-red-400 text-sm" role="alert">
          {error}
        </p>
      )}
      {loading && habits.length === 0 ? (
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      ) : (
        <CardList>
          {habits.map((h) => {
            const entries = entriesByHabit[h.id] || []
            const successful = successfulByHabit[h.id] || 0
            return (
              <Card key={h.id} title={h.name || h.id}>
                <p className="text-sm text-text-muted">
                  {successful} / {entries.length} successful entries
                  {entries.length > 0 ? ` (${Math.round((successful / entries.length) * 100)}%)` : ''}
                </p>
                {h.frequency && <p className="text-xs text-text-muted mt-1">Frequency: {h.frequency}</p>}
              </Card>
            )
          })}
        </CardList>
      )}
    </div>
  )
}
