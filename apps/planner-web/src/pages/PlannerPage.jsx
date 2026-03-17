import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Spinner,
  PageHeader,
  WeekView,
  Switch,
  Fab,
  Modal,
  IconCheckSquare,
  IconHeart,
  IconHeartFire,
  IconCalendar,
  IconChevronDown,
  IconChevronUp,
} from '@tools/shared'
import { getWeekDays, getWeekStart, getTodayStr } from '@tools/shared'
import { usePlannerApi } from '../contexts/PlannerApiContext'
import { getTaskStatusGroup } from '../lib/taskStatus'
import { readPlannerPrefs, writePlannerPrefs } from '../lib/plannerPrefs'
import {
  getEventsForDay,
  getEventsWithColumnLayout,
  getEventsVisibility,
} from '../lib/eventsLayout'
import { PlannerTaskCard } from '../components/PlannerTaskCard'
import { TaskModal } from '../components/TaskModal'
import { useTouchDrag } from '../hooks/useTouchDrag'

const EVENTS_SLOT_HEIGHT_PX = 28
const EVENTS_DEFAULT_START_HOUR = 7
const EVENTS_DEFAULT_END_HOUR = 19
const EVENTS_FULL_DAY_START_HOUR = 5
const EVENTS_FULL_DAY_END_HOUR = 22

const TASKS_QUERY = `
  query { tasks { id taskName status description dueDate priority } }
`
const HABITS_QUERY = `
  query { habits { id name description category type } }
`
const HABIT_TRACKING_QUERY = `
  query { habitTracking { id habitId executionDateTime wasSuccessful } }
`
const CALENDAR_EVENTS_QUERY = `
  query CalendarEvents($timeMin: String!, $timeMax: String!) {
    calendarEvents(timeMin: $timeMin, timeMax: $timeMax) {
      id
      summary
      description
      start
      end
      calendarSlot
      calendarLabel
      calendarColor
      htmlLink
      location
    }
  }
`
const UPDATE_TASK = `
  mutation UpdateTask($id: ID!, $input: TaskUpdateInput!) {
    updateTask(id: $id, input: $input) { id dueDate }
  }
`
const TOGGLE_HABIT = `
  mutation ToggleHabit($input: ToggleHabitInput!) {
    toggleHabit(input: $input) { id wasSuccessful }
  }
`

const DRAG_TYPE_TASK = 'application/x-planner-task'

function getWeekDaysForOffset(weekOffset) {
  const start = getWeekStart(new Date())
  start.setDate(start.getDate() + weekOffset * 7)
  return getWeekDays(start)
}

function getTasksForDay(tasks, dayStr) {
  return tasks.filter((t) => (t.dueDate || '').slice(0, 10) === dayStr)
}

function getHabitEntryForDay(tracking, habitId, dayStr) {
  return tracking.find(
    (t) => t.habitId === habitId && (t.executionDateTime || '').slice(0, 10) === dayStr
  )
}

function isHabitEntrySuccessful(entry) {
  return entry?.wasSuccessful === true
}

/** Filter habits by type field: "Good" | "Bad" (case-insensitive). Falls back to name/description containing "bad" if type is missing. */
function filterHabitsByType(habits, type) {
  const want = String(type).trim().toLowerCase()
  return (habits || []).filter((h) => {
    const t = (h.type || '').trim().toLowerCase()
    if (t) return t === want
    const name = (h.name || '').toLowerCase()
    const desc = (h.description || '').toLowerCase()
    const isBad = name.includes('bad') || desc.includes('bad')
    return want === 'bad' ? isBad : !isBad
  })
}

/** Group habits by category. '' = uncategorized. Order: named categories A–Z, uncategorized last. Within category, habits sorted by name. */
function getHabitsByCategory(habits) {
  const list = Array.isArray(habits) ? habits : []
  const map = new Map()
  for (const h of list) {
    const cat = (h.category || '').trim()
    if (!map.has(cat)) map.set(cat, [])
    map.get(cat).push(h)
  }
  for (const arr of map.values()) {
    arr.sort((a, b) => (a.name || a.id || '').localeCompare(b.name || b.id || ''))
  }
  const withName = [...map.entries()].filter(([k]) => k !== '').sort((a, b) => a[0].localeCompare(b[0]))
  const withoutName = map.get('') || []
  return withoutName.length ? [...withName, ['', withoutName]] : withName
}

/** One row of 5 hearts: good = green, bad = red. habitVariant 'good' | 'bad'. */
function DayHabitsCounters({ dayStr, habits, habitTracking, habitVariant = 'good' }) {
  const habitsDoneCount = habits.filter((h) => {
    const entry = getHabitEntryForDay(habitTracking, h.id, dayStr)
    return entry && isHabitEntrySuccessful(entry)
  }).length
  const displayCount = Math.min(habitsDoneCount, 5)
  const isGood = habitVariant === 'good'
  const CounterIcon = (n) => (n === 5 ? IconHeartFire : IconHeart)
  const counterColor = (n) => {
    if (n > habitsDoneCount) return 'text-border'
    if (n === 5) return isGood ? 'text-green-600' : 'text-red-600'
    return isGood ? 'text-green-500' : 'text-red-500'
  }
  const counterSize = (n) => (n === 5 ? 18 : 14)
  return (
    <div className="w-full pt-0.5 pb-0 flex items-center gap-0.5 px-1" title={`${habitsDoneCount} ${habitVariant} habits`}>
      {[1, 2, 3, 4, 5].map((n) => {
        const Icon = CounterIcon(n)
        return (
          <span key={n} className={`shrink-0 ${counterColor(n)}`} title={n === 5 ? '5+' : `${n}`}>
            <Icon size={counterSize(n)} />
          </span>
        )
      })}
    </div>
  )
}

/** One day column for habits: good counters row, bad counters row, then list of habits. */
function DayHabitsColumn({ dayStr, goodHabits, badHabits, allHabits, habitTracking, onHabitToggle }) {
  return (
    <div className="flex flex-col min-w-0 px-2">
      <DayHabitsCounters dayStr={dayStr} habits={goodHabits} habitTracking={habitTracking} habitVariant="good" />
      <DayHabitsCounters dayStr={dayStr} habits={badHabits} habitTracking={habitTracking} habitVariant="bad" />
      <div className="w-full space-y-0.5 mt-2">
        {allHabits.length === 0 && <p className="text-xs text-text-muted py-1">No habits</p>}
        {getHabitsByCategory(allHabits).map(([categoryLabel, habitsInCategory]) => (
          <div key={categoryLabel || '_uncategorized'} className="space-y-0.5">
            {categoryLabel && (
              <p className="text-xs font-medium text-text-muted pt-1 first:pt-0">{categoryLabel}</p>
            )}
            <ul className="space-y-0.5 w-full list-none p-0 m-0">
              {habitsInCategory.map((habit) => {
                const entry = getHabitEntryForDay(habitTracking, habit.id, dayStr)
                const isDone = entry && isHabitEntrySuccessful(entry)
                return (
                  <li key={habit.id}>
                    <button
                      type="button"
                      onClick={() => onHabitToggle(habit.id, dayStr)}
                      className={`w-full flex items-center gap-2 py-0.5 text-left text-sm rounded hover:bg-black/10 dark:hover:bg-white/5 transition-colors ${isDone ? 'opacity-90' : ''}`}
                      aria-pressed={isDone}
                    >
                      <span
                        className={`shrink-0 w-4 h-4 rounded-sm border flex items-center justify-center text-[10px] ${
                          isDone ? 'bg-primary border-primary text-white' : 'bg-surface border-border text-transparent'
                        }`}
                      >
                        {isDone && '✓'}
                      </span>
                      <span className={`truncate ${isDone ? 'line-through opacity-80' : ''}`}>
                        {habit.name || habit.id}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}

/** Task progress bar only (one day) — shown when Tasks section is collapsed. */
function DayTaskProgressBar({ dayStr, tasks }) {
  const tasksForDay = getTasksForDay(tasks, dayStr)
  const total = tasksForDay.length
  const doneCount = tasksForDay.filter((t) => getTaskStatusGroup(t) === 'done').length
  const inProgressCount = tasksForDay.filter((t) => getTaskStatusGroup(t) === 'in_progress').length
  const pendingCount = tasksForDay.filter((t) => getTaskStatusGroup(t) === 'pending').length
  const donePct = total === 0 ? 0 : Math.round((doneCount / total) * 100)
  const inProgressPct = total === 0 ? 0 : Math.round((inProgressCount / total) * 100)
  const pendingPct = total === 0 ? 0 : Math.round((pendingCount / total) * 100)
  return (
    <div className="flex items-center gap-2 pt-0.5 pb-0 px-2 min-w-0">
      <span className="text-xs font-medium text-text-muted shrink-0">({total})</span>
      <div className="flex-1 h-2 rounded-full overflow-hidden flex min-w-0" role="progressbar" aria-valuenow={donePct} aria-valuemin={0} aria-valuemax={100}>
        {total === 0 ? (
          <div className="h-full bg-status-pending shrink-0 w-full" />
        ) : (
          <>
            {donePct > 0 && <div className="h-full bg-status-done shrink-0" style={{ width: `${donePct}%` }} />}
            {inProgressPct > 0 && <div className="h-full bg-status-in-progress shrink-0" style={{ width: `${inProgressPct}%` }} />}
            {pendingPct > 0 && <div className="h-full bg-status-pending shrink-0" style={{ width: `${pendingPct}%` }} />}
          </>
        )}
      </div>
      <span className="text-xs font-medium text-text-muted shrink-0">{donePct}%</span>
    </div>
  )
}

/** Habits counters only (good + bad rows) for one day — shown when Habits section is collapsed. */
function DayHabitsCountersOnly({ dayStr, goodHabits, badHabits, habitTracking }) {
  return (
    <div className="flex flex-col min-w-0 px-2">
      <DayHabitsCounters dayStr={dayStr} habits={goodHabits} habitTracking={habitTracking} habitVariant="good" />
      <DayHabitsCounters dayStr={dayStr} habits={badHabits} habitTracking={habitTracking} habitVariant="bad" />
    </div>
  )
}

/** Time labels column for events (left side). */
function EventsTimeLabelsColumn({ startHour, endHour }) {
  const slotsCount = (endHour - startHour) * 2
  const slotLabels = []
  for (let i = 0; i < slotsCount; i++) {
    const h = startHour + Math.floor(i / 2)
    const m = (i % 2) * 30
    slotLabels.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`)
  }
  return (
    <div className="flex flex-col shrink-0 pr-1 border-r border-border/50" style={{ minHeight: slotsCount * EVENTS_SLOT_HEIGHT_PX }}>
      {slotLabels.map((label, idx) => (
        <div key={idx} className="flex items-center text-xs text-text-muted shrink-0" style={{ height: EVENTS_SLOT_HEIGHT_PX, minHeight: EVENTS_SLOT_HEIGHT_PX }}>
          <span className="shrink-0 w-9">{label}</span>
        </div>
      ))}
    </div>
  )
}

/** One day column for events: slots with event blocks; multi-column where overlapping. */
function DayEventsColumn({ dayStr, events, startHour, endHour, onEventClick }) {
  const withLayout = getEventsWithColumnLayout(events, dayStr, startHour, endHour)
  const slotsCount = (endHour - startHour) * 2
  const { hasEventsBefore, hasEventsAfter } = getEventsVisibility(events, dayStr, startHour, endHour)
  return (
    <div
      className={`flex flex-col min-w-0 px-1 relative border-l border-r border-transparent ${hasEventsBefore ? 'border-t-2 border-t-primary/60' : ''} ${hasEventsAfter ? 'border-b-2 border-b-primary/60' : ''}`}
      style={{ minHeight: slotsCount * EVENTS_SLOT_HEIGHT_PX }}
    >
      {Array(slotsCount).fill(null).map((_, idx) => (
        <div key={idx} className="shrink-0 border-b border-border/30" style={{ height: EVENTS_SLOT_HEIGHT_PX, minHeight: EVENTS_SLOT_HEIGHT_PX }} />
      ))}
      {withLayout.map(({ event: ev, slotIndex, span, columnIndex, totalColumns }) => {
        const top = slotIndex * EVENTS_SLOT_HEIGHT_PX
        const height = span * EVENTS_SLOT_HEIGHT_PX - 2
        const hasColor = ev.calendarColor && /^#[0-9A-Fa-f]{6}$/.test(ev.calendarColor)
        const eventStyle = {
          top: top + 1,
          height,
          minHeight: 20,
          left: totalColumns <= 1 ? 4 : `calc(4px + (100% - 8px) * ${columnIndex / totalColumns}${columnIndex > 0 ? ' + 2px' : ''})`,
          width: totalColumns <= 1 ? 'calc(100% - 8px)' : `calc((100% - 8px) / ${totalColumns} - 2px)`,
          ...(hasColor ? { backgroundColor: `${ev.calendarColor}26`, borderColor: ev.calendarColor, borderWidth: 1, borderStyle: 'solid' } : {}),
        }
        const title = (ev.summary || 'Event') + (ev.calendarLabel ? ` (${ev.calendarLabel})` : '')
        return (
          <div
            key={ev.id}
            role="button"
            tabIndex={0}
            onClick={() => onEventClick?.(ev)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onEventClick?.(ev) } }}
            className={`absolute rounded px-1.5 py-0.5 overflow-hidden text-text text-xs ${hasColor ? '' : 'bg-primary/15 border border-primary/40'} cursor-pointer hover:opacity-90 focus:outline focus:ring-2 focus:ring-primary`}
            style={eventStyle}
            title={title}
          >
            <span className="font-medium truncate block">{ev.summary || 'Event'}</span>
            {ev.start && <span className="text-text-muted text-[10px] truncate block">{ev.start.slice(11, 16)} – {ev.end?.slice(11, 16) || ''}</span>}
          </div>
        )
      })}
    </div>
  )
}

/** Event count per day when Events section is collapsed. */
function DayEventsSummary({ dayStr, events }) {
  const n = getEventsForDay(events, dayStr).length
  return (
    <div className="flex flex-col min-w-0 px-2 py-1">
      <span className="text-xs font-medium text-text-muted" title={`${n} events`}>({n})</span>
    </div>
  )
}

function DayTasksColumn({
  dayStr,
  tasks,
  showCompleted,
  onTaskStatusChange,
  onTaskClick,
  onTaskMove,
  refetch,
}) {
  const [dragOver, setDragOver] = useState(false)
  const [draggingTaskId, setDraggingTaskId] = useState(null)

  const tasksForDay = getTasksForDay(tasks, dayStr)
  const total = tasksForDay.length
  const doneCount = tasksForDay.filter((t) => getTaskStatusGroup(t) === 'done').length
  const inProgressCount = tasksForDay.filter((t) => getTaskStatusGroup(t) === 'in_progress').length
  const pendingCount = tasksForDay.filter((t) => getTaskStatusGroup(t) === 'pending').length
  const donePct = total === 0 ? 0 : Math.round((doneCount / total) * 100)
  const inProgressPct = total === 0 ? 0 : Math.round((inProgressCount / total) * 100)
  const pendingPct = total === 0 ? 0 : Math.round((pendingCount / total) * 100)

  const pending = tasksForDay.filter((t) => getTaskStatusGroup(t) === 'pending')
  const inProgress = tasksForDay.filter((t) => getTaskStatusGroup(t) === 'in_progress')
  const done = tasksForDay.filter((t) => getTaskStatusGroup(t) === 'done')
  const visibleTasks = showCompleted ? [...pending, ...inProgress, ...done] : [...pending, ...inProgress]

  const handleDragStart = (e, task) => {
    e.dataTransfer.setData(DRAG_TYPE_TASK, JSON.stringify({ taskId: task.id, fromDayStr: dayStr }))
    e.dataTransfer.effectAllowed = 'move'
    setDraggingTaskId(task.id)
  }
  const handleDragEnd = () => setTimeout(() => setDraggingTaskId(null), 100)
  const handleDragOver = (e) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOver(true)
  }
  const handleDragLeave = (e) => {
    if (!e.currentTarget.contains(e.relatedTarget)) setDragOver(false)
  }
  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    const raw = e.dataTransfer.getData(DRAG_TYPE_TASK)
    if (!raw || !onTaskMove) return
    try {
      const { taskId, fromDayStr } = JSON.parse(raw)
      if (fromDayStr !== dayStr) onTaskMove(taskId, dayStr)
    } catch (_) {}
  }

  return (
    <div
      data-drop-zone="task"
      data-day-str={dayStr}
      className={`flex flex-col min-w-0 px-2 rounded-lg transition-colors min-h-[80px] ${
        dragOver ? 'ring-2 ring-primary bg-primary/5' : ''
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="flex items-center gap-2 pt-0.5 pb-0">
        <span className="text-xs font-medium text-text-muted shrink-0">({total})</span>
        <div className="flex-1 h-2 rounded-full overflow-hidden flex min-w-0" role="progressbar">
          {total === 0 ? (
            <div className="h-full bg-status-pending shrink-0 w-full" />
          ) : (
            <>
              {donePct > 0 && (
                <div className="h-full bg-status-done shrink-0" style={{ width: `${donePct}%` }} />
              )}
              {inProgressPct > 0 && (
                <div
                  className="h-full bg-status-in-progress shrink-0"
                  style={{ width: `${inProgressPct}%` }}
                />
              )}
              {pendingPct > 0 && (
                <div
                  className="h-full bg-status-pending shrink-0"
                  style={{ width: `${pendingPct}%` }}
                />
              )}
            </>
          )}
        </div>
        <span className="text-xs font-medium text-text-muted shrink-0">{donePct}%</span>
      </div>
      <ul className="space-y-2 w-full mt-3 list-none p-0 m-0">
        {visibleTasks.length === 0 && (
          <li className="text-xs text-text-muted py-1">No tasks</li>
        )}
        {visibleTasks.map((task) => (
          <DayTaskRow
            key={task.id}
            task={task}
            dayStr={dayStr}
            onTaskStatusChange={onTaskStatusChange}
            onTaskClick={onTaskClick}
            onTaskMove={onTaskMove}
            refetch={refetch}
            draggingTaskId={draggingTaskId}
            setDraggingTaskId={setDraggingTaskId}
            setDragOver={setDragOver}
          />
        ))}
      </ul>
    </div>
  )
}

function DayTaskRow({
  task,
  dayStr,
  onTaskStatusChange,
  onTaskClick,
  onTaskMove,
  refetch,
  draggingTaskId,
  setDraggingTaskId,
  setDragOver,
}) {
  const touchDrag = useTouchDrag({
    getPayload: () => ({ taskId: task.id, fromDayStr: dayStr }),
    onDropTarget: (target) => {
      if (target?.dayStr && target.dayStr !== dayStr && onTaskMove) {
        onTaskMove(task.id, target.dayStr)
      }
    },
    setDragging: (v) => setDraggingTaskId(v ? task.id : null),
    setDragOverTarget: (target) => setDragOver(!!(target?.dayStr === dayStr)),
  })

  return (
    <li
      ref={touchDrag.ref}
      className="w-full cursor-grab active:cursor-grabbing"
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData(DRAG_TYPE_TASK, JSON.stringify({ taskId: task.id, fromDayStr: dayStr }))
        e.dataTransfer.effectAllowed = 'move'
        setDraggingTaskId(task.id)
      }}
      onDragEnd={() => setTimeout(() => setDraggingTaskId(null), 100)}
      onTouchStart={touchDrag.onTouchStart}
    >
      <PlannerTaskCard
        task={task}
        dayStr={dayStr}
        onStatusChange={onTaskStatusChange}
        onOpenModal={onTaskClick}
        refetch={refetch}
        isDragging={draggingTaskId === task.id}
      />
    </li>
  )
}

export function PlannerPage() {
  const { graphql } = usePlannerApi()
  const [weekOffset, setWeekOffset] = useState(0)
  const [tasks, setTasks] = useState([])
  const [habits, setHabits] = useState([])
  const [habitTracking, setHabitTracking] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const prefs = readPlannerPrefs()
  const [showCompleted, setShowCompleted] = useState(() => prefs.showCompleted)
  const [showFullDay, setShowFullDay] = useState(() => prefs.showFullDay)
  const [tasksCollapsed, setTasksCollapsed] = useState(() => prefs.tasksCollapsed)
  const [eventsCollapsed, setEventsCollapsed] = useState(() => prefs.eventsCollapsed)
  const [habitsCollapsed, setHabitsCollapsed] = useState(() => prefs.habitsCollapsed)
  const [events, setEvents] = useState([])
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [fabMenuOpen, setFabMenuOpen] = useState(false)
  const [modalTask, setModalTask] = useState(null)
  const [createTaskOpen, setCreateTaskOpen] = useState(false)
  const [eventModalOpen, setEventModalOpen] = useState(false)

  useEffect(() => {
    writePlannerPrefs({ showCompleted, showFullDay })
  }, [showCompleted, showFullDay])
  useEffect(() => {
    writePlannerPrefs({ tasksCollapsed, eventsCollapsed, habitsCollapsed })
  }, [tasksCollapsed, eventsCollapsed, habitsCollapsed])

  const weekDays = getWeekDaysForOffset(weekOffset)
  const weekLabel = weekDays[0] && weekDays[6] ? `${weekDays[0]} – ${weekDays[6]}` : 'Week'
  const todayStr = getTodayStr()
  const timeMin = weekDays[0] ? `${weekDays[0]}T00:00:00` : ''
  const timeMax = weekDays[6] ? `${weekDays[6]}T23:59:59` : ''
  const goodHabits = useMemo(() => filterHabitsByType(habits, 'good'), [habits])
  const badHabits = useMemo(() => filterHabitsByType(habits, 'bad'), [habits])
  const allHabits = useMemo(() => [...goodHabits, ...badHabits], [goodHabits, badHabits])
  const eventsStartHour = showFullDay ? EVENTS_FULL_DAY_START_HOUR : EVENTS_DEFAULT_START_HOUR
  const eventsEndHour = showFullDay ? EVENTS_FULL_DAY_END_HOUR : EVENTS_DEFAULT_END_HOUR

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [tasksData, habitsData, trackingData] = await Promise.all([
        graphql(TASKS_QUERY),
        graphql(HABITS_QUERY),
        graphql(HABIT_TRACKING_QUERY),
      ])
      setTasks(tasksData?.tasks ?? [])
      setHabits(habitsData?.habits ?? [])
      setHabitTracking(trackingData?.habitTracking ?? [])
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [graphql])

  const loadCalendarEvents = useCallback(async () => {
    if (!timeMin || !timeMax) return
    try {
      const data = await graphql(CALENDAR_EVENTS_QUERY, { timeMin, timeMax })
      setEvents(Array.isArray(data?.calendarEvents) ? data.calendarEvents : [])
    } catch {
      setEvents([])
    }
  }, [graphql, timeMin, timeMax])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    loadCalendarEvents()
  }, [loadCalendarEvents])

  const handleTaskStatusChange = useCallback(
    async (taskId, status) => {
      try {
        await graphql(UPDATE_TASK, { id: taskId, input: { status } })
        setTasks((prev) =>
          prev.map((t) => (t.id === taskId ? { ...t, status } : t))
        )
      } catch (err) {
        console.error(err)
      }
    },
    [graphql]
  )

  const handleTaskMove = useCallback(
    async (taskId, newDayStr) => {
      try {
        await graphql(UPDATE_TASK, { id: taskId, input: { dueDate: newDayStr } })
        setTasks((prev) =>
          prev.map((t) => (t.id === taskId ? { ...t, dueDate: newDayStr } : t))
        )
      } catch (err) {
        console.error(err)
      }
    },
    [graphql]
  )

  const handleHabitToggle = useCallback(
    async (habitId, dayStr) => {
      try {
        await graphql(TOGGLE_HABIT, {
          input: { habitId, date: dayStr },
        })
        await load()
      } catch (err) {
        console.error(err)
      }
    },
    [graphql, load]
  )

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
      <PageHeader title="Planner" onRefresh={load} loading={loading} />
      <p className="text-sm text-text-muted -mt-4">{weekLabel}</p>
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
        {/* Tasks section: collapsible; progress bars always visible; switch only when expanded, aligned right */}
        <section className="mt-4">
          <div className="flex items-center gap-2 mb-2">
            <h2 className="text-lg font-bold text-text m-0">Tasks</h2>
            <div className="flex-1 min-w-0" />
            {!tasksCollapsed && (
              <span className="mr-2">
                <Switch checked={showCompleted} onChange={setShowCompleted} label="Show completed" />
              </span>
            )}
            <button
              type="button"
              onClick={() => setTasksCollapsed((c) => !c)}
              className="shrink-0 p-1 rounded text-text-muted hover:bg-black/10 dark:hover:bg-white/10 hover:text-text"
              aria-expanded={!tasksCollapsed}
              title={tasksCollapsed ? 'Expand' : 'Collapse'}
            >
              {tasksCollapsed ? <IconChevronDown size={20} /> : <IconChevronUp size={20} />}
            </button>
          </div>
          {/* When collapsed: only progress bars. When expanded: full columns (each has its own progress bar). */}
          {tasksCollapsed ? (
            <div className="grid grid-cols-7 gap-2">
              {weekDays.map((dayStr) => (
                <DayTaskProgressBar key={dayStr} dayStr={dayStr} tasks={tasks} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-2">
              {weekDays.map((dayStr) => (
                <DayTasksColumn
                  key={dayStr}
                  dayStr={dayStr}
                  tasks={tasks}
                  showCompleted={showCompleted}
                  onTaskStatusChange={handleTaskStatusChange}
                  onTaskClick={setModalTask}
                  onTaskMove={handleTaskMove}
                  refetch={load}
                />
              ))}
            </div>
          )}
        </section>

        {/* Events section: collapsible; switch only when expanded; time column + 7 day columns */}
        <section className="mt-6">
          <div className="flex items-center gap-2 mb-2">
            <h2 className="text-lg font-bold text-text m-0">Events</h2>
            <div className="flex-1 min-w-0" />
            {!eventsCollapsed && (
              <span className="mr-2">
                <Switch checked={showFullDay} onChange={setShowFullDay} label="Show full day" />
              </span>
            )}
            <button
              type="button"
              onClick={() => setEventsCollapsed((c) => !c)}
              className="shrink-0 p-1 rounded text-text-muted hover:bg-black/10 dark:hover:bg-white/10 hover:text-text"
              aria-expanded={!eventsCollapsed}
              title={eventsCollapsed ? 'Expand' : 'Collapse'}
            >
              {eventsCollapsed ? <IconChevronDown size={20} /> : <IconChevronUp size={20} />}
            </button>
          </div>
          {/* Summary row when collapsed */}
          {eventsCollapsed && (
            <div className="grid grid-cols-7 gap-2">
              {weekDays.map((dayStr) => (
                <DayEventsSummary key={dayStr} dayStr={dayStr} events={events} />
              ))}
            </div>
          )}
          {!eventsCollapsed && (
            <div className="flex gap-0 min-h-[120px]">
              <EventsTimeLabelsColumn startHour={eventsStartHour} endHour={eventsEndHour} />
              <div className="flex-1 grid grid-cols-7 gap-0 min-w-0">
                {weekDays.map((dayStr) => (
                  <DayEventsColumn
                    key={dayStr}
                    dayStr={dayStr}
                    events={events}
                    startHour={eventsStartHour}
                    endHour={eventsEndHour}
                    onEventClick={setSelectedEvent}
                  />
                ))}
              </div>
            </div>
          )}
          {!eventsCollapsed && events.length === 0 && (
            <p className="text-sm text-text-muted mt-2 px-2">Calendar events are not available yet. Connect your calendar in settings when supported.</p>
          )}
        </section>

        {/* Habits section: collapsible; when collapsed only counters; when expanded full columns (counters + list) */}
        {(goodHabits.length > 0 || badHabits.length > 0) && (
          <section className="mt-6">
            <div className="flex items-center gap-2 mb-2">
              <h2 className="text-lg font-bold text-text m-0">Habits</h2>
              <div className="flex-1 min-w-0" />
              <button
                type="button"
                onClick={() => setHabitsCollapsed((c) => !c)}
                className="shrink-0 p-1 rounded text-text-muted hover:bg-black/10 dark:hover:bg-white/10 hover:text-text"
                aria-expanded={!habitsCollapsed}
                title={habitsCollapsed ? 'Expand' : 'Collapse'}
              >
                {habitsCollapsed ? <IconChevronDown size={20} /> : <IconChevronUp size={20} />}
              </button>
            </div>
            {habitsCollapsed ? (
              <div className="grid grid-cols-7 gap-2">
                {weekDays.map((dayStr) => (
                  <DayHabitsCountersOnly
                    key={dayStr}
                    dayStr={dayStr}
                    goodHabits={goodHabits}
                    badHabits={badHabits}
                    habitTracking={habitTracking}
                  />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-7 gap-2">
                {weekDays.map((dayStr) => (
                  <DayHabitsColumn
                    key={dayStr}
                    dayStr={dayStr}
                    goodHabits={goodHabits}
                    badHabits={badHabits}
                    allHabits={allHabits}
                    habitTracking={habitTracking}
                    onHabitToggle={handleHabitToggle}
                  />
                ))}
              </div>
            )}
          </section>
        )}
      </WeekView>

      <Fab
        onClick={() => setFabMenuOpen((o) => !o)}
        ariaLabel={fabMenuOpen ? 'Close menu' : 'Add task or event'}
        variant={fabMenuOpen ? 'close' : 'add'}
      />

      {fabMenuOpen && (
        <Modal
          open={true}
          onClose={() => setFabMenuOpen(false)}
          title="Add"
          ariaLabelledBy="fab-menu-title"
        >
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => {
                setFabMenuOpen(false)
                setCreateTaskOpen(true)
              }}
              className="flex items-center gap-3 w-full p-3 rounded-lg border border-border bg-surface text-text hover:bg-border/50 text-left"
            >
              <IconCheckSquare size={24} />
              New task
            </button>
            <button
              type="button"
              onClick={() => {
                setFabMenuOpen(false)
                setEventModalOpen(true)
              }}
              className="flex items-center gap-3 w-full p-3 rounded-lg border border-border bg-surface text-text hover:bg-border/50 text-left"
            >
              <IconCalendar size={24} />
              New event
            </button>
          </div>
        </Modal>
      )}

      {createTaskOpen && (
        <TaskModal
          task={null}
          onClose={() => setCreateTaskOpen(false)}
          onSaved={load}
          initialValues={{ dueDate: todayStr }}
        />
      )}
      {modalTask && (
        <TaskModal task={modalTask} onClose={() => setModalTask(null)} onSaved={load} />
      )}
      {eventModalOpen && (
        <Modal
          open={true}
          onClose={() => setEventModalOpen(false)}
          title="New event"
          ariaLabelledBy="event-modal-title"
        >
          <p className="text-text-muted text-sm">
            Calendar events are not available yet. Connect your calendar in settings when supported.
          </p>
        </Modal>
      )}

      {selectedEvent && (
        <Modal
          open={true}
          onClose={() => setSelectedEvent(null)}
          title={selectedEvent.summary || 'Event'}
          ariaLabelledBy="event-detail-title"
        >
          <div className="space-y-3 text-sm">
            {selectedEvent.start && (
              <p className="text-text-muted">
                {selectedEvent.start.slice(0, 16).replace('T', ' ')} – {selectedEvent.end?.slice(11, 16) || '—'}
              </p>
            )}
            {selectedEvent.description && <p className="text-text">{selectedEvent.description}</p>}
            <p className="text-text-muted italic">
              Edit and delete will be available when calendar is connected.
            </p>
          </div>
        </Modal>
      )}
    </div>
  )
}
