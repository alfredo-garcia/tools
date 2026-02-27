import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useApi, Spinner, PageHeader, Card, IconCheckSquare, IconCircle } from '@tools/shared'
import { field, str, dateStr, getWeekDays, getWeekdayIndex } from '@tools/shared'
import { getTaskStatusGroup } from '../lib/taskStatus'

const DAY_NAMES = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
const STATUS_OPTIONS = [
  { value: 'Pending', label: 'Pendiente' },
  { value: 'In Progress', label: 'En progreso' },
  { value: 'Done', label: 'Hecho' },
]

function usePlannerData() {
  const { fetchApi } = useApi()
  const [data, setData] = useState({
    tasks: [],
    habits: [],
    habitTracking: [],
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const refetch = useCallback(() => {
    setLoading(true)
    setError(null)
    Promise.all([
      fetchApi('/api/tasks').then((r) => r.data || []),
      fetchApi('/api/habits').then((r) => r.data || []),
      fetchApi('/api/habit-tracking').then((r) => r.data || []),
    ])
      .then(([tasks, habits, habitTracking]) => {
        setData({ tasks, habits, habitTracking })
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [fetchApi])

  useEffect(() => {
    refetch()
  }, [refetch])

  return { data, loading, error, refetch }
}

function getTasksForDay(tasks, dayStr) {
  return tasks.filter((t) => dateStr(field(t, 'Due Date', 'Due Date')) === dayStr)
}

function getHabitEntryForDay(habitTracking, habitId, dayStr) {
  return habitTracking.find((t) => {
    const link = field(t, 'Habit', 'Habit')
    const ids = Array.isArray(link) ? link : link != null ? [link] : []
    const matchesHabit = ids.includes(habitId)
    const entryDate = dateStr(field(t, 'Execution Date-Time', 'Execution Date-Time', 'Execution Date'))
    return matchesHabit && entryDate === dayStr
  })
}

function isHabitEntrySuccessful(entry) {
  if (!entry) return false
  const v = field(entry, 'Was Successful?', 'Was Successful')
  return v === true || String(v).toLowerCase() === 'yes' || v === '1'
}

function completionPct(tasksForDay, habits, habitTracking, dayStr) {
  const totalTasks = tasksForDay.length
  const tasksDone = tasksForDay.filter((t) => getTaskStatusGroup(t) === 'done').length
  const totalHabits = habits.length
  const habitsDone = habits.filter((h) => {
    const entry = getHabitEntryForDay(habitTracking, h.id, dayStr)
    return entry && isHabitEntrySuccessful(entry)
  }).length
  const total = totalTasks + totalHabits
  if (total === 0) return 0
  return Math.round(((tasksDone + habitsDone) / total) * 100)
}

function DayColumn({
  dayStr,
  dayIndex,
  tasks,
  habits,
  habitTracking,
  onTaskStatusChange,
  onHabitToggle,
  refetch,
}) {
  const tasksForDay = getTasksForDay(tasks, dayStr)
  const pct = completionPct(tasksForDay, habits, habitTracking, dayStr)
  const dayLabel = DAY_NAMES[dayIndex]
  const dateLabel = dayStr ? new Date(dayStr + 'T12:00:00').getDate() : ''

  return (
    <div className="flex flex-col min-w-0 rounded-xl border-2 border-border bg-surface overflow-hidden">
      <div className="p-3 border-b border-border bg-background/50">
        <div className="font-semibold text-text">{dayLabel}</div>
        <div className="text-sm text-text-muted">{dateLabel}</div>
      </div>
      <div className="p-3">
        <div className="flex items-center gap-2">
          <div className="flex-1 h-3 rounded-full bg-border overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${pct}%` }}
              role="progressbar"
              aria-valuenow={pct}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
          <span className="text-sm font-bold text-text shrink-0">{pct}%</span>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-4">
        <section>
          <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-2">Tareas</h3>
          <ul className="space-y-2">
            {tasksForDay.length === 0 && (
              <li className="text-sm text-text-muted">Ninguna tarea</li>
            )}
            {tasksForDay.map((task) => (
              <PlannerTaskCard
                key={task.id}
                task={task}
                onStatusChange={onTaskStatusChange}
                refetch={refetch}
              />
            ))}
          </ul>
        </section>
        <section>
          <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-2">Hábitos</h3>
          <ul className="space-y-2">
            {habits.length === 0 && (
              <li className="text-sm text-text-muted">Ningún hábito</li>
            )}
            {habits.map((habit) => (
              <PlannerHabitRow
                key={habit.id}
                habit={habit}
                dayStr={dayStr}
                habitTracking={habitTracking}
                onToggle={onHabitToggle}
                refetch={refetch}
              />
            ))}
          </ul>
        </section>
      </div>
    </div>
  )
}

function PlannerTaskCard({ task, onStatusChange, refetch }) {
  const name = str(field(task, 'Task Name', 'Task Name')) || '(sin nombre)'
  const statusGroup = getTaskStatusGroup(task)

  const handleStatus = async (newStatus) => {
    try {
      await onStatusChange(task.id, newStatus)
      refetch()
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <li>
      <Card
        title={name}
        icon={<IconCheckSquare size={18} />}
        className={statusGroup === 'done' ? 'opacity-90' : ''}
        buttons={
          <div className="flex flex-wrap gap-1">
            {STATUS_OPTIONS.map(({ value, label }) => {
              const isActive =
                (value === 'Done' && statusGroup === 'done') ||
                (value === 'In Progress' && statusGroup === 'in_progress') ||
                (value === 'Pending' && statusGroup === 'pending')
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => handleStatus(value)}
                  className={`min-h-[36px] px-2 py-1 rounded-lg text-xs font-medium ${
                    isActive ? 'bg-primary text-white' : 'bg-border/50 text-text hover:bg-border'
                  }`}
                >
                  {label}
                </button>
              )
            })}
          </div>
        }
      >
        <Link to={`/tasks/${task.id}`} className="text-sm text-primary hover:underline">
          Ver detalle
        </Link>
      </Card>
    </li>
  )
}

function PlannerHabitRow({ habit, dayStr, habitTracking, onToggle, refetch }) {
  const name = str(field(habit, 'Habit Name', 'Habit Name')) || '(sin nombre)'
  const entry = getHabitEntryForDay(habitTracking, habit.id, dayStr)
  const isDone = entry && isHabitEntrySuccessful(entry)

  const handleToggle = async () => {
    try {
      await onToggle(habit.id, dayStr, isDone, entry?.id)
      refetch()
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <li className="flex items-center gap-2 rounded-lg border border-border bg-background/50 p-2">
      <button
        type="button"
        onClick={handleToggle}
        aria-pressed={isDone}
        className={`shrink-0 w-8 h-8 rounded-lg border-2 flex items-center justify-center font-bold text-sm transition-colors ${
          isDone
            ? 'bg-primary text-white border-primary'
            : 'bg-surface border-border text-text-muted hover:border-primary'
        }`}
      >
        {isDone ? '✓' : '○'}
      </button>
      <span className={`flex-1 min-w-0 text-sm ${isDone ? 'text-text line-through' : 'text-text'}`}>
        {name}
      </span>
    </li>
  )
}

export function PlannerPage() {
  const { fetchApi } = useApi()
  const { data, loading, error, refetch } = usePlannerData()
  const { tasks, habits, habitTracking } = data
  const weekDays = getWeekDays()
  const todayStr = new Date().toISOString().slice(0, 10)
  const defaultDayIndex = getWeekdayIndex(todayStr)
  const [mobileDayIndex, setMobileDayIndex] = useState(defaultDayIndex >= 0 ? defaultDayIndex : 0)
  const [touchStartX, setTouchStartX] = useState(null)

  const handleTouchStart = (e) => {
    setTouchStartX(e.targetTouches[0].clientX)
  }
  const handleTouchEnd = (e) => {
    if (touchStartX == null) return
    const endX = e.changedTouches[0].clientX
    const diff = touchStartX - endX
    if (Math.abs(diff) > 50) {
      if (diff > 0) setMobileDayIndex((i) => Math.min(6, i + 1))
      else setMobileDayIndex((i) => Math.max(0, i - 1))
    }
    setTouchStartX(null)
  }

  const handleTaskStatusChange = useCallback(
    async (taskId, status) => {
      await fetchApi(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        body: JSON.stringify({ Status: status }),
      })
    },
    [fetchApi]
  )

  const handleHabitToggle = useCallback(
    async (habitId, date, currentlyDone, entryId) => {
      if (currentlyDone && entryId) {
        await fetchApi(`/api/habit-tracking/${entryId}`, {
          method: 'PATCH',
          body: JSON.stringify({ 'Was Successful?': false }),
        })
      } else if (entryId) {
        await fetchApi(`/api/habit-tracking/${entryId}`, {
          method: 'PATCH',
          body: JSON.stringify({ 'Was Successful?': true }),
        })
      } else {
        await fetchApi('/api/habit-tracking', {
          method: 'POST',
          body: JSON.stringify({ Habit: habitId, date }),
        })
      }
    },
    [fetchApi]
  )

  if (loading && tasks.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    )
  }
  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader breadcrumbs={[{ label: 'Home', to: '/' }, { label: 'Planner' }]} />
        <div className="rounded-2xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-6">
          <p className="text-red-700 dark:text-red-300">{error}</p>
        </div>
      </div>
    )
  }

  const dayColumns = weekDays.map((dayStr, i) => (
    <DayColumn
      key={dayStr}
      dayStr={dayStr}
      dayIndex={i}
      tasks={tasks}
      habits={habits}
      habitTracking={habitTracking}
      onTaskStatusChange={handleTaskStatusChange}
      onHabitToggle={handleHabitToggle}
      refetch={refetch}
    />
  ))

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={[{ label: 'Home', to: '/' }, { label: 'Planner' }]}
        onRefresh={refetch}
        loading={loading}
      />

      {/* Desktop: 7 columns */}
      <div className="hidden md:grid md:grid-cols-7 gap-3 overflow-x-auto">
        {dayColumns}
      </div>

      {/* Mobile: single column with swipe / arrows */}
      <div className="md:hidden">
        <div className="flex items-center justify-between gap-2 mb-3">
          <button
            type="button"
            aria-label="Día anterior"
            onClick={() => setMobileDayIndex((i) => Math.max(0, i - 1))}
            disabled={mobileDayIndex === 0}
            className="min-h-[44px] min-w-[44px] rounded-xl border-2 border-border bg-surface text-text disabled:opacity-50 disabled:pointer-events-none"
          >
            ←
          </button>
          <span className="font-semibold text-text">
            {DAY_NAMES[mobileDayIndex]} {weekDays[mobileDayIndex] ? new Date(weekDays[mobileDayIndex] + 'T12:00:00').getDate() : ''}
          </span>
          <button
            type="button"
            aria-label="Día siguiente"
            onClick={() => setMobileDayIndex((i) => Math.min(6, i + 1))}
            disabled={mobileDayIndex === 6}
            className="min-h-[44px] min-w-[44px] rounded-xl border-2 border-border bg-surface text-text disabled:opacity-50 disabled:pointer-events-none"
          >
            →
          </button>
        </div>
        <div
          className="overflow-hidden touch-pan-y"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {dayColumns[mobileDayIndex]}
        </div>
      </div>
    </div>
  )
}
