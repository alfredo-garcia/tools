import { useState, useEffect, useCallback, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import {
  Spinner,
  PageHeader,
  EntityDetailPage,
  Card,
  KpiCard,
} from '@tools/shared'
import { isInLastDays, isThisWeek, isThisMonth } from '@tools/shared'
import { usePlannerApi } from '../contexts/PlannerApiContext'
import { isHabitSuccess } from '@tools/shared-planner'
import { habitTrackingFieldAccessor } from '../lib/fieldAccessor'

const HABITS_QUERY = `
  query { habits { id name description frequency lastModified } }
`
const HABIT_TRACKING_QUERY = `
  query { habitTracking { id habitId executionDateTime wasSuccessful lastModified } }
`

const fieldAccessor = habitTrackingFieldAccessor()

function getTrackingDate(record) {
  const v = fieldAccessor(record, 'Execution Date-Time', 'Execution Date')
  if (!v) return ''
  return String(v).slice(0, 10)
}

function successPctForPeriod(tracking) {
  if (!Array.isArray(tracking) || tracking.length === 0) return 0
  const ok = tracking.filter((t) => isHabitSuccess(t, { fieldAccessor })).length
  return Math.round((ok / tracking.length) * 100)
}

export function HabitDetail() {
  const { id } = useParams()
  const { graphql } = usePlannerApi()
  const [habit, setHabit] = useState(null)
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
      const list = habitsData?.habits ?? []
      setHabit(list.find((h) => h.id === id) ?? null)
      const allTracking = trackingData?.habitTracking ?? []
      setTracking(allTracking.filter((t) => t.habitId === id))
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [graphql, id])

  useEffect(() => {
    load()
  }, [load])

  const last3Days = useMemo(
    () => tracking.filter((t) => isInLastDays(getTrackingDate(t), 3)),
    [tracking]
  )
  const thisWeekTracking = useMemo(
    () => tracking.filter((t) => isThisWeek(getTrackingDate(t))),
    [tracking]
  )
  const thisMonthTracking = useMemo(
    () => tracking.filter((t) => isThisMonth(getTrackingDate(t))),
    [tracking]
  )

  const pct3 = successPctForPeriod(last3Days)
  const pctWeek = successPctForPeriod(thisWeekTracking)
  const pctMonth = successPctForPeriod(thisMonthTracking)

  const recentTracking = useMemo(
    () =>
      [...tracking]
        .sort((a, b) => (getTrackingDate(b) || '').localeCompare(getTrackingDate(a) || ''))
        .slice(0, 30),
    [tracking]
  )

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
      <EntityDetailPage
        header={
          <PageHeader
            breadcrumbs={[{ label: 'Habits', to: '/habits' }, { label: 'Habit' }]}
          />
        }
      >
        <p className="text-text-muted">{error || 'Habit not found.'}</p>
      </EntityDetailPage>
    )
  }

  const title = habit.name || 'Habit'

  return (
    <EntityDetailPage
      header={
        <PageHeader
          breadcrumbs={[{ label: 'Habits', to: '/habits' }, { label: title }]}
          onRefresh={load}
          loading={loading}
        />
      }
    >
      {error && (
        <p className="text-red-600 dark:text-red-400 text-sm mb-4" role="alert">
          {error}
        </p>
      )}

      <Card className="rounded-2xl border-2 border-border p-5">
        <h2 className="font-bold text-xl text-text">{title}</h2>
        {habit.description && (
          <p className="text-sm text-text whitespace-pre-wrap mt-2">{habit.description}</p>
        )}
        {habit.frequency && (
          <p className="text-sm text-text-muted mt-1">{habit.frequency}</p>
        )}
      </Card>

      <section className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard title="Last 3 days" value={`${pct3}%`} subtitle="Success" />
        <KpiCard title="This week" value={`${pctWeek}%`} subtitle="Success" />
        <KpiCard title="This month" value={`${pctMonth}%`} subtitle="Success" />
      </section>

      <section className="mt-6">
        <h3 className="text-lg font-bold text-text mb-2">Recent history</h3>
        <ul className="space-y-1 list-none p-0 m-0">
          {recentTracking.map((t) => {
            const dateStr = getTrackingDate(t)
            const success = isHabitSuccess(t, { fieldAccessor })
            return (
              <li
                key={t.id}
                className="flex items-center gap-2 text-sm py-1"
              >
                <span
                  className={`shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                    success
                      ? 'bg-status-done text-white'
                      : 'bg-border text-text-muted'
                  }`}
                  aria-hidden
                >
                  {success ? '✓' : '○'}
                </span>
                <span className="text-text-muted">{dateStr}</span>
              </li>
            )
          })}
        </ul>
        {recentTracking.length === 0 && (
          <p className="text-sm text-text-muted">No tracking entries yet.</p>
        )}
      </section>
    </EntityDetailPage>
  )
}
