import { useState, useEffect, useCallback } from 'react'
import { Spinner, PageHeader, WeekView } from '@tools/shared'
import { getWeekDays, getWeekStart } from '@tools/shared'
import { usePlannerApi } from '../contexts/PlannerApiContext'

const TASKS_QUERY = `
  query { tasks { id taskName status dueDate priority } }
`
const HABITS_QUERY = `
  query { habits { id name } }
`

function getWeekDaysForOffset(weekOffset) {
  const start = getWeekStart(new Date())
  start.setDate(start.getDate() + weekOffset * 7)
  return getWeekDays(start)
}

export function PlannerPage() {
  const { graphql } = usePlannerApi()
  const [weekOffset, setWeekOffset] = useState(0)
  const [tasks, setTasks] = useState([])
  const [habits, setHabits] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const weekDays = getWeekDaysForOffset(weekOffset)
  const weekLabel = weekDays[0] && weekDays[6] ? `${weekDays[0]} – ${weekDays[6]}` : 'Week'

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [tasksData, habitsData] = await Promise.all([
        graphql(TASKS_QUERY),
        graphql(HABITS_QUERY),
      ])
      setTasks(tasksData?.tasks ?? [])
      setHabits(habitsData?.habits ?? [])
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [graphql])

  useEffect(() => {
    load()
  }, [load])

  if (loading && tasks.length === 0 && habits.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-12">
        <Spinner />
        <p className="text-text-muted">Loading planner…</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Planner" subtitle={weekLabel} />
      {error && (
        <p className="text-red-600 dark:text-red-400 text-sm" role="alert">
          {error}
        </p>
      )}
      <WeekView
        weekDays={weekDays}
        onPrevWeek={() => setWeekOffset((o) => o - 1)}
        onNextWeek={() => setWeekOffset((o) => o + 1)}
        renderDayHeader={(dayStr) => (
          <span className="text-sm font-medium text-text truncate block">{dayStr}</span>
        )}
      >
        <div className="grid grid-cols-7 gap-2 mt-4">
          {weekDays.map((dayStr) => (
            <div key={dayStr} className="min-h-[120px] rounded-lg border border-border bg-surface p-2">
              <p className="text-xs text-text-muted mb-1">{dayStr}</p>
              <ul className="text-sm">
                {tasks
                  .filter((t) => (t.dueDate || '').slice(0, 10) === dayStr)
                  .slice(0, 3)
                  .map((t) => (
                    <li key={t.id} className="truncate">
                      {t.taskName || '(untitled)'}
                    </li>
                  ))}
              </ul>
            </div>
          ))}
        </div>
      </WeekView>
      {habits.length > 0 && (
        <section>
          <h2 className="text-lg font-bold text-text mb-2">Habits</h2>
          <ul className="flex flex-wrap gap-2">
            {habits.map((h) => (
              <li key={h.id} className="px-3 py-1.5 rounded-full bg-surface border border-border text-sm">
                {h.name || h.id}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
