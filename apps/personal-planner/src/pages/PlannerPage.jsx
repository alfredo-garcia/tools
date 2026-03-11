import { useState, useEffect, useCallback } from 'react'
import { usePlannerApi } from '../contexts/PlannerApiContext'
import { Spinner, PageHeader, Switch, IconChevronDown, IconChevronUp, IconChevronLeft, IconChevronRight, IconStar, IconFlameFilled, IconPoop, IconTarget, IconCalendar, IconUser, IconTag, IconCircle, IconPlay, IconCheckSquare, IconTrash, IconHeart, IconHeartFire } from '@tools/shared'
import { field, str, dateStr, arr, getWeekDays, getWeekStart, getWeekdayIndex } from '@tools/shared'
import { getTaskStatusGroup } from '../lib/taskStatus'
import { getEventsForDay, eventToVisibleSlots, getEventsVisibility, getEventsWithColumnLayout } from '../lib/calendarEventsUtils'
import { TaskCard, STATUS_OPTIONS, getPriorityTagClass } from '../components/TaskCard'
import { TaskModal } from '../components/TaskModal'
import { EventModal } from '../components/EventModal'
import { Fab } from '@tools/shared'
import { useTouchDrag } from '../hooks/useTouchDrag'

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const MIN_GOOD_HABITS_FOR_FIRE = 5
const MIN_BAD_HABITS_FOR_SKULL = 2
const PLANNER_PREFS_KEY = 'mosco-planner-prefs'

function getOrdinalSuffix(n) {
  const d = n % 10
  const teenth = Math.floor(n / 10) % 10 === 1
  if (teenth) return 'th'
  if (d === 1) return 'st'
  if (d === 2) return 'nd'
  if (d === 3) return 'rd'
  return 'th'
}

function readPlannerPrefs() {
  if (typeof window === 'undefined') return { habitsCollapsed: false, showCompleted: false, eventsCollapsed: true, showFullDay: false }
  try {
    const raw = localStorage.getItem(PLANNER_PREFS_KEY)
    if (!raw) return { habitsCollapsed: false, showCompleted: false, eventsCollapsed: true, showFullDay: false }
    const p = JSON.parse(raw)
    const habitsCollapsed = p.habitsCollapsed !== undefined ? Boolean(p.habitsCollapsed) : (Boolean(p.goodHabitsCollapsed) && Boolean(p.badHabitsCollapsed))
    const showCompleted = Boolean(p.showCompleted)
    const eventsCollapsed = p.eventsCollapsed !== undefined ? Boolean(p.eventsCollapsed) : true
    const showFullDay = Boolean(p.showFullDay)
    return { habitsCollapsed, showCompleted, eventsCollapsed, showFullDay }
  } catch (_) {
    return { habitsCollapsed: false, showCompleted: false, eventsCollapsed: true, showFullDay: false }
  }
}

function writePlannerPrefs(prefs) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(PLANNER_PREFS_KEY, JSON.stringify(prefs))
  } catch (_) {}
}

function getWeekDaysForOffset(weekOffset) {
  const start = getWeekStart(new Date())
  start.setDate(start.getDate() + weekOffset * 7)
  return getWeekDays(start)
}

/** Parse YYYY-MM-DD as local date (avoids UTC midnight causing wrong week in some timezones). */
function parseLocalDate(dateStr) {
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}/.test(dateStr)) return new Date()
  const [y, m, day] = dateStr.slice(0, 10).split('-').map(Number)
  return new Date(y, m - 1, day)
}

function addDays(dateStr, delta) {
  const d = new Date(dateStr + 'T12:00:00')
  d.setDate(d.getDate() + delta)
  return d.toISOString().slice(0, 10)
}

function usePlannerData() {
  const { fetchApi } = usePlannerApi()
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
    return Promise.all([
      fetchApi('/api/tasks').then((r) => (Array.isArray(r?.data) ? r.data : [])),
      fetchApi('/api/habits').then((r) => (Array.isArray(r?.data) ? r.data : [])),
      fetchApi('/api/habit-tracking').then((r) => (Array.isArray(r?.data) ? r.data : [])),
    ])
      .then(([tasks, habits, habitTracking]) => {
        setData({ tasks, habits, habitTracking })
      })
      .catch((e) => {
        setError(e.message)
        throw e
      })
      .finally(() => setLoading(false))
  }, [fetchApi])

  const updateHabitTracking = useCallback((updater) => {
    setData((prev) => ({ ...prev, habitTracking: updater(prev.habitTracking || []) }))
  }, [])

  useEffect(() => {
    refetch()
  }, [refetch])

  return { data, loading, error, refetch, updateHabitTracking }
}

function getTasksForDay(tasks, dayStr) {
  return tasks.filter((t) => dateStr(field(t, 'Due Date', 'Due Date')) === dayStr)
}

/** Events calendar: default 7:00–19:00; "Show full day" 5:00–22:00. 30-min slots, height per slot. */
const EVENTS_DEFAULT_START_HOUR = 7
const EVENTS_DEFAULT_END_HOUR = 19
const EVENTS_FULL_DAY_START_HOUR = 5
const EVENTS_FULL_DAY_END_HOUR = 22
const EVENTS_SLOT_HEIGHT_PX = 28

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

function formatDayDate(dayStr) {
  if (!dayStr) return ''
  const d = new Date(dayStr + 'T12:00:00')
  const day = d.getDate()
  return `${MONTH_NAMES[d.getMonth()]} ${day}${getOrdinalSuffix(day)}`
}

function dayHeaderStars(tasksForDay, habits, habitTracking, dayStr) {
  const totalTasks = tasksForDay.length
  const tasksDone = tasksForDay.filter((t) => getTaskStatusGroup(t) === 'done').length
  const allTasksDone = totalTasks > 0 && tasksDone === totalTasks
  const goodHabits = filterHabitsByType(habits, 'Good')
  const badHabits = filterHabitsByType(habits, 'Bad')
  const goodHabitsDoneCount = goodHabits.filter((h) => {
    const entry = getHabitEntryForDay(habitTracking, h.id, dayStr)
    return entry && isHabitEntrySuccessful(entry)
  }).length
  const badHabitsDoneCount = badHabits.filter((h) => {
    const entry = getHabitEntryForDay(habitTracking, h.id, dayStr)
    return entry && isHabitEntrySuccessful(entry)
  }).length
  const hasFire = goodHabitsDoneCount >= MIN_GOOD_HABITS_FOR_FIRE
  const hasSkull = badHabitsDoneCount >= MIN_BAD_HABITS_FOR_SKULL
  const hasStar = allTasksDone
  return { hasStar, hasFire, hasSkull }
}

/** Group habits by category. '' key = uncategorized. Order: named categories first (A–Z), uncategorized last. Within each category, habits sorted by name (A–Z). */
function getHabitsByCategory(habits) {
  const list = Array.isArray(habits) ? habits : []
  const map = new Map()
  const habitName = (h) => str(field(h, 'Habit Name', 'Habit Name')) || ''
  for (const h of list) {
    const cat = str(field(h, 'Category', 'Category')) || ''
    if (!map.has(cat)) map.set(cat, [])
    map.get(cat).push(h)
  }
  for (const arr of map.values()) arr.sort((a, b) => habitName(a).localeCompare(habitName(b)))
  const withName = [...map.entries()].filter(([k]) => k !== '').sort((a, b) => a[0].localeCompare(b[0]))
  const withoutName = map.get('') || []
  return withoutName.length ? [...withName, ['', withoutName]] : withName
}

/** Filtra hábitos por columna "Habit type" (o "Habit Type"). type = "Good" | "Bad" (case-insensitive). */
function filterHabitsByType(habits, type) {
  const list = Array.isArray(habits) ? habits : []
  const want = String(type).trim().toLowerCase()
  return list.filter((h) => {
    const v = str(field(h, 'Habit type', 'Habit Type')) || ''
    return v.trim().toLowerCase() === want
  })
}

/** Desktop day header cell (name + date + stars). */
function DayHeaderCell({ dayStr, dayIndex, tasks, habits, habitTracking }) {
  const tasksForDay = getTasksForDay(tasks, dayStr)
  const { hasStar, hasFire, hasSkull } = dayHeaderStars(tasksForDay, habits, habitTracking, dayStr)
  const dayLabel = DAY_NAMES[dayIndex]
  return (
    <div className="py-2 shrink-0 flex items-center justify-between gap-2 px-2 min-w-0">
      <div className="min-w-0">
        <div className="font-bold text-text truncate">{dayLabel}</div>
        <div className="text-sm text-text-muted">{formatDayDate(dayStr)}</div>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        {hasStar && (
          <span className="inline-flex items-center justify-center h-6 text-amber-500" title={hasFire ? 'Tasks done + 5+ Good Habits' : 'All tasks done'}>
            <IconStar size={20} />
          </span>
        )}
        {hasFire && (
          <span className="inline-flex items-center justify-center h-6 text-orange-500" title="5+ Good Habits">
            <IconFlameFilled size={20} />
          </span>
        )}
        {hasSkull && (
          <span className="inline-flex items-center justify-center h-6 text-amber-600" title="2+ Bad Habits">
            <IconPoop size={20} />
          </span>
        )}
      </div>
    </div>
  )
}

const DRAG_TYPE_TASK = 'application/x-planner-task'

/** Summary row for Events section when collapsed: event count per day. */
function DayEventsSummary({ dayStr, events }) {
  const forDay = getEventsForDay(events, dayStr)
  const n = forDay.length
  return (
    <div className="flex flex-col min-w-0 px-2 py-1">
      <span className="text-xs font-medium text-text-muted" title={`${n} events`}>
        ({n})
      </span>
    </div>
  )
}

/** Time labels column (30-min slots). Used once on the left in week view. */
function EventsTimeLabelsColumn({ startHour, endHour }) {
  const slotsCount = (endHour - startHour) * 2
  const slotLabels = []
  for (let i = 0; i < slotsCount; i++) {
    const h = startHour + Math.floor(i / 2)
    const m = (i % 2) * 30
    slotLabels.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`)
  }
  return (
    <div className="flex flex-col shrink-0 pr-2 border-r border-border/50" style={{ minHeight: slotsCount * EVENTS_SLOT_HEIGHT_PX }}>
      {slotLabels.map((label, idx) => (
        <div
          key={idx}
          className="flex items-center text-xs text-text-muted shrink-0"
          style={{ height: EVENTS_SLOT_HEIGHT_PX, minHeight: EVENTS_SLOT_HEIGHT_PX }}
        >
          <span className="shrink-0 w-8">{label}</span>
        </div>
      ))}
    </div>
  )
}

/** One day column for Events: 30-min slots with events positioned. Overlapping events are shown in 2 or 3 columns. showTimeLabels: true on mobile, false in week view. onEventClick(ev): when provided, event blocks are clickable to edit. */
function DayEventsColumn({ dayStr, events, showTimeLabels = false, startHour, endHour, onEventClick }) {
  const withLayout = getEventsWithColumnLayout(events, dayStr, startHour, endHour)
  const slotsCount = (endHour - startHour) * 2
  const { hasEventsBefore, hasEventsAfter } = getEventsVisibility(events, dayStr, startHour, endHour)
  const slotLabels = showTimeLabels ? (() => {
    const out = []
    for (let i = 0; i < slotsCount; i++) {
      const h = startHour + Math.floor(i / 2)
      const m = (i % 2) * 30
      out.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`)
    }
    return out
  })() : null
  return (
    <div
      className={`flex flex-col min-w-0 px-2 relative border-l border-r border-transparent ${hasEventsBefore ? 'border-t-2 border-t-primary/60' : ''} ${hasEventsAfter ? 'border-b-2 border-b-primary/60' : ''}`}
      style={{ minHeight: slotsCount * EVENTS_SLOT_HEIGHT_PX }}
    >
      {(slotLabels || Array(slotsCount).fill(null)).map((label, idx) => (
        <div
          key={idx}
          className="flex items-center border-b border-border/50 text-xs text-text-muted shrink-0"
          style={{ height: EVENTS_SLOT_HEIGHT_PX, minHeight: EVENTS_SLOT_HEIGHT_PX }}
        >
          {label != null && <span className="shrink-0 w-8">{label}</span>}
        </div>
      ))}
      {withLayout.map(({ event: ev, slotIndex, span, columnIndex, totalColumns }) => {
        const top = slotIndex * EVENTS_SLOT_HEIGHT_PX
        const height = span * EVENTS_SLOT_HEIGHT_PX - 2
        const hasColor = ev.calendarColor && /^#[0-9A-Fa-f]{6}$/.test(ev.calendarColor)
        const eventStyle = {
          top: top + 1,
          height,
          minHeight: 20,
          left: totalColumns <= 1 ? 8 : `calc(8px + (100% - 16px) * ${columnIndex / totalColumns}${columnIndex > 0 ? ' + 2px' : ''})`,
          width: totalColumns <= 1 ? 'calc(100% - 16px)' : `calc((100% - 16px) / ${totalColumns} - 2px)`,
          ...(hasColor
            ? {
                backgroundColor: `${ev.calendarColor}26`,
                borderColor: ev.calendarColor,
                borderWidth: 1,
                borderStyle: 'solid',
              }
            : {}),
        }
        const title = ev.summary + (ev.calendarLabel ? ` (${ev.calendarLabel})` : '')
        const clickable = Boolean(onEventClick)
        return (
          <div
            key={ev.id}
            role={clickable ? 'button' : undefined}
            tabIndex={clickable ? 0 : undefined}
            onClick={clickable ? () => onEventClick(ev) : undefined}
            onKeyDown={clickable ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onEventClick(ev) } } : undefined}
            className={`absolute rounded px-1.5 py-0.5 overflow-hidden text-text text-xs ${hasColor ? '' : 'bg-primary/15 border border-primary/40'} ${clickable ? 'cursor-pointer hover:opacity-90 focus:outline focus:ring-2 focus:ring-primary' : ''}`}
            style={eventStyle}
            title={clickable ? `${title} — Click to edit` : title}
          >
            <span className="font-medium truncate block">{ev.summary || 'Event'}</span>
            {ev.start && (
              <span className="text-text-muted text-[10px] truncate block">
                {ev.start.slice(11, 16)} – {ev.end?.slice(11, 16) || ''}
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}

/** Solo la barra de progreso de tareas de un día (para mostrar cuando la sección Tasks está colapsada). */
function DayTaskProgressBar({ dayStr, tasks }) {
  const tasksForDay = getTasksForDay(tasks, dayStr)
  const total = tasksForDay.length
  const doneCount = tasksForDay.filter((t) => getTaskStatusGroup(t) === 'done').length
  const inProgressCount = tasksForDay.filter((t) => getTaskStatusGroup(t) === 'in_progress').length
  const pendingCount = tasksForDay.filter((t) => getTaskStatusGroup(t) === 'pending').length
  const donePct = total === 0 ? 0 : Math.round((doneCount / total) * 100)
  const inProgressPct = total === 0 ? 0 : Math.round((inProgressCount / total) * 100)
  const pendingPct = total === 0 ? 0 : Math.round((pendingCount / total) * 100)
  const progressBarTitle = total === 0
    ? 'No tasks'
    : `Done: ${donePct}%, In progress: ${inProgressPct}%, To do: ${pendingPct}%`
  return (
    <div className="w-full flex items-center gap-2 pt-0.5 pb-0">
      <span className="text-xs font-medium text-text-muted shrink-0" title={progressBarTitle}>({total})</span>
      <div
        className="flex-1 h-2 rounded-full overflow-hidden flex min-w-0"
        role="progressbar"
        aria-valuenow={donePct}
        aria-valuemin={0}
        aria-valuemax={100}
        title={progressBarTitle}
      >
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

/** Columna de tasks de un día (header + barra + lista). Sin collapse.
 * showCompleted: si true, se muestran las Done al final.
 * onTaskMove(taskId, newDayStr): al soltar una tarea en esta columna, actualiza Due Date.
 */
function DayTasksColumn({ dayStr, tasks, showCompleted = false, onTaskStatusChange, onTaskClick, onTaskMove, refetch }) {
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
  const progressBarTitle = total === 0
    ? 'No tasks'
    : `Done: ${donePct}%, In progress: ${inProgressPct}%, To do: ${pendingPct}%`
  const pending = tasksForDay.filter((t) => getTaskStatusGroup(t) === 'pending')
  const inProgress = tasksForDay.filter((t) => getTaskStatusGroup(t) === 'in_progress')
  const done = tasksForDay.filter((t) => getTaskStatusGroup(t) === 'done')
  const visibleTasks = showCompleted ? [...pending, ...inProgress, ...done] : [...pending, ...inProgress]

  function TaskDraggableRow({ task, onTaskStatusChange, onTaskClick, refetch }) {
    const touchDrag = useTouchDrag({
      getPayload: () => ({ taskId: task.id, fromDayStr: dayStr }),
      onDropTarget: (target) => {
        if (target?.dayStr && target.dayStr !== dayStr && onTaskMove) onTaskMove(task.id, target.dayStr)
      },
      setDragging: (v) => setDraggingTaskId(v ? task.id : null),
      setDragOverTarget: (target) => setDragOver(target?.dayStr === dayStr),
    })
    return (
      <li
        ref={touchDrag.ref}
        className="w-full cursor-grab active:cursor-grabbing"
        draggable
        onDragStart={(e) => handleDragStart(e, task)}
        onDragEnd={handleDragEnd}
        {...touchDrag}
      >
        <TaskCard
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

  const handleDragStart = (e, task) => {
    e.dataTransfer.setData(DRAG_TYPE_TASK, JSON.stringify({ taskId: task.id, fromDayStr: dayStr }))
    e.dataTransfer.effectAllowed = 'move'
    setDraggingTaskId(task.id)
  }
  const handleDragEnd = () => {
    setTimeout(() => setDraggingTaskId(null), 100)
  }
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
      className={`flex flex-col min-w-0 px-2 rounded-lg transition-colors min-h-[80px] ${dragOver ? 'ring-2 ring-primary bg-primary/5' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="w-full flex items-center gap-2 pt-0.5 pb-0">
        <span className="text-xs font-medium text-text-muted shrink-0" title={progressBarTitle}>({total})</span>
        <div
          className="flex-1 h-2 rounded-full overflow-hidden flex min-w-0"
          role="progressbar"
          aria-valuenow={donePct}
          aria-valuemin={0}
          aria-valuemax={100}
          title={progressBarTitle}
        >
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
      <ul className="space-y-2 w-full mt-3">
        {visibleTasks.length === 0 && <li className="text-xs text-text-muted py-1">No tasks</li>}
        {visibleTasks.map((task) => (
          <TaskDraggableRow
            key={task.id}
            task={task}
            onTaskStatusChange={onTaskStatusChange}
            onTaskClick={onTaskClick}
            refetch={refetch}
          />
        ))}
      </ul>
    </div>
  )
}

/** Solo la fila de contadores (1–5) para un día. habitVariant: 'good' = hearts green, 'bad' = hearts red. */
function DayHabitsCounters({ dayStr, habits, habitTracking, habitVariant = 'good' }) {
  const habitsDoneCount = habits.filter((h) => {
    const entry = getHabitEntryForDay(habitTracking, h.id, dayStr)
    return entry && isHabitEntrySuccessful(entry)
  }).length
  const isGood = habitVariant === 'good'
  const CounterIcon = (n) => (n === 5 ? IconHeartFire : IconHeart)
  const counterColor = (n) => {
    if (n > habitsDoneCount) return 'text-border'
    if (n === 5) return isGood ? 'text-green-600' : 'text-red-600'
    return isGood ? 'text-green-500' : 'text-red-500'
  }
  const counterSize = (n) => (n === 5 ? 18 : 14)
  return (
    <div className="w-full pt-0.5 pb-0 flex items-center gap-0.5 px-2">
      {[1, 2, 3, 4, 5].map((n) => {
        const Icon = CounterIcon(n)
        return (
          <span key={n} className={`shrink-0 ${counterColor(n)}`} title={n === 5 ? '5+ habits' : `Point ${n}`}>
            <Icon size={counterSize(n)} />
          </span>
        )
      })}
    </div>
  )
}

/** Per-day habits column: two counter rows (good + bad) and one list (all habits by category, alphabetical within category). */
function DayHabitsColumn({ dayStr, goodHabits, badHabits, allHabits, habitTracking, onHabitToggle }) {
  return (
    <div className="flex flex-col min-w-0 px-2">
      <DayHabitsCounters dayStr={dayStr} habits={goodHabits} habitTracking={habitTracking} habitVariant="good" />
      <DayHabitsCounters dayStr={dayStr} habits={badHabits} habitTracking={habitTracking} habitVariant="bad" />
      <div className="w-full space-y-3 mt-3">
        {allHabits.length === 0 && <p className="text-xs text-text-muted py-1">No habits</p>}
        {getHabitsByCategory(allHabits).map(([categoryLabel, habitsInCategory]) => (
          <div key={categoryLabel || '_sin_categoria'} className="space-y-0.5">
            {categoryLabel && <p className="text-xs font-medium text-text-muted px-0.5 py-0.5">{categoryLabel}</p>}
            <ul className="space-y-0.5 w-full">
              {habitsInCategory.map((habit) => (
                <PlannerHabitRow key={habit.id} habit={habit} dayStr={dayStr} habitTracking={habitTracking} onToggle={onHabitToggle} />
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}

/** Draggable task row for mobile day column (touch + mouse drag). */
function MobileTaskDraggableRow({
  task,
  dayStr,
  onTaskMove,
  onTaskStatusChange,
  onTaskClick,
  refetch,
  draggingTaskId,
  setDraggingTaskId,
  setTasksDragOver,
}) {
  const touchDrag = useTouchDrag({
    getPayload: () => ({ taskId: task.id, fromDayStr: dayStr }),
    onDropTarget: (target) => {
      if (target?.dayStr && target.dayStr !== dayStr && onTaskMove) onTaskMove(task.id, target.dayStr)
    },
    setDragging: (v) => setDraggingTaskId(v ? task.id : null),
    setDragOverTarget: (target) => setTasksDragOver(!!(target?.dayStr === dayStr)),
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
      {...touchDrag}
    >
      <TaskCard task={task} dayStr={dayStr} onStatusChange={onTaskStatusChange} onOpenModal={onTaskClick} refetch={refetch} isDragging={draggingTaskId === task.id} />
    </li>
  )
}

function DayColumn({
  dayStr,
  dayIndex,
  tasks,
  habits,
  goodHabits,
  badHabits,
  habitTracking,
  onTaskStatusChange,
  onHabitToggle,
  onTaskClick,
  onTaskMove,
  refetch,
  hideDayHeader = false,
  habitsCollapsed: controlledHabitsCollapsed,
  showCompleted: controlledShowCompleted,
  onHabitsCollapsedChange,
  onShowCompletedChange,
  middleSection = null,
}) {
  const [tasksCollapsed, setTasksCollapsed] = useState(false)
  const [localHabitsCollapsed, setLocalHabitsCollapsed] = useState(false)
  const [localShowCompleted, setLocalShowCompleted] = useState(false)
  const [tasksDragOver, setTasksDragOver] = useState(false)
  const [draggingTaskId, setDraggingTaskId] = useState(null)

  const habitsCollapsed = onHabitsCollapsedChange != null ? controlledHabitsCollapsed : localHabitsCollapsed
  const showCompleted = onShowCompletedChange != null ? controlledShowCompleted : localShowCompleted
  const setHabitsCollapsed = onHabitsCollapsedChange ?? setLocalHabitsCollapsed
  const setShowCompleted = onShowCompletedChange ?? setLocalShowCompleted

  const tasksForDay = getTasksForDay(tasks, dayStr)
  const total = tasksForDay.length
  const doneCount = tasksForDay.filter((t) => getTaskStatusGroup(t) === 'done').length
  const inProgressCount = tasksForDay.filter((t) => getTaskStatusGroup(t) === 'in_progress').length
  const pendingCount = tasksForDay.filter((t) => getTaskStatusGroup(t) === 'pending').length
  const donePct = total === 0 ? 0 : Math.round((doneCount / total) * 100)
  const inProgressPct = total === 0 ? 0 : Math.round((inProgressCount / total) * 100)
  const pendingPct = total === 0 ? 0 : Math.round((pendingCount / total) * 100)
  const progressBarTitle = total === 0
    ? 'No tasks'
    : `Done: ${donePct}%, In progress: ${inProgressPct}%, To do: ${pendingPct}%`
  const { hasStar, hasFire, hasSkull } = dayHeaderStars(tasksForDay, habits, habitTracking, dayStr)
  const dayLabel = DAY_NAMES[dayIndex]

  return (
    <div className="flex flex-col min-w-0 overflow-y-auto overflow-x-hidden px-2">
      {!hideDayHeader && (
        <div className="py-2 shrink-0 flex items-center justify-between gap-2">
          <div>
            <div className="font-bold text-text">{dayLabel}</div>
            <div className="text-sm text-text-muted">{formatDayDate(dayStr)}</div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {hasStar && (
              <span className="inline-flex items-center justify-center h-6 text-amber-500" title={hasFire ? 'Tasks done + 5+ Good Habits' : 'All tasks done'}>
                <IconStar size={20} />
              </span>
            )}
            {hasFire && (
              <span className="inline-flex items-center justify-center h-6 text-orange-500" title="5+ Good Habits">
                <IconFlameFilled size={20} />
              </span>
            )}
            {hasSkull && (
              <span className="inline-flex items-center justify-center h-6 text-amber-600" title="2+ Bad Habits">
                <IconPoop size={20} />
              </span>
            )}
          </div>
        </div>
      )}

      <button type="button" onClick={() => setTasksCollapsed((c) => !c)} className="w-full flex items-center justify-between gap-2 py-1.5 text-left font-semibold text-base text-text">
        <span>Tasks</span>
        <span className="flex items-center gap-3 shrink-0">
          <span onClick={(e) => e.stopPropagation()}>
            <Switch checked={showCompleted} onChange={setShowCompleted} label="Show completed" />
          </span>
          {tasksCollapsed ? <IconChevronDown size={22} /> : <IconChevronUp size={22} />}
        </span>
      </button>
      <div className="w-full flex items-center gap-2 pt-0.5 pb-0">
        <span className="text-xs font-medium text-text-muted shrink-0" title={progressBarTitle}>({total})</span>
        <div className="flex-1 h-2 rounded-full overflow-hidden flex min-w-0" role="progressbar" aria-valuenow={donePct} aria-valuemin={0} aria-valuemax={100} aria-label={progressBarTitle} title={progressBarTitle}>
          {total === 0 ? (
            <div className="h-full bg-status-pending transition-all shrink-0 w-full" />
          ) : (
            <>
              {donePct > 0 && <div className="h-full bg-status-done transition-all shrink-0" style={{ width: `${donePct}%` }} />}
              {inProgressPct > 0 && <div className="h-full bg-status-in-progress transition-all shrink-0" style={{ width: `${inProgressPct}%` }} />}
              {pendingPct > 0 && <div className="h-full bg-status-pending transition-all shrink-0" style={{ width: `${pendingPct}%` }} />}
            </>
          )}
        </div>
        <span className="text-xs font-medium text-text-muted shrink-0" title={progressBarTitle}>{donePct}%</span>
      </div>
      {!tasksCollapsed && (
        <>
          <div
            data-drop-zone="task"
            data-day-str={dayStr}
            className={`rounded-lg mt-3 min-h-[60px] transition-colors ${tasksDragOver ? 'ring-2 ring-primary bg-primary/5' : ''}`}
            onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; setTasksDragOver(true) }}
            onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setTasksDragOver(false) }}
            onDrop={(e) => {
              e.preventDefault()
              setTasksDragOver(false)
              const raw = e.dataTransfer.getData(DRAG_TYPE_TASK)
              if (!raw || !onTaskMove) return
              try {
                const { taskId, fromDayStr } = JSON.parse(raw)
                if (fromDayStr !== dayStr) onTaskMove(taskId, dayStr)
              } catch (_) {}
            }}
          >
            <ul className="space-y-2 w-full">
              {(() => {
                const pending = tasksForDay.filter((t) => getTaskStatusGroup(t) === 'pending')
                const inProgress = tasksForDay.filter((t) => getTaskStatusGroup(t) === 'in_progress')
                const done = tasksForDay.filter((t) => getTaskStatusGroup(t) === 'done')
                const visibleTasks = showCompleted ? [...pending, ...inProgress, ...done] : [...pending, ...inProgress]
                if (visibleTasks.length === 0) return <li className="text-xs text-text-muted py-1">No tasks</li>
                return visibleTasks.map((task) => (
                  <MobileTaskDraggableRow
                    key={task.id}
                    task={task}
                    dayStr={dayStr}
                    onTaskMove={onTaskMove}
                    onTaskStatusChange={onTaskStatusChange}
                    onTaskClick={onTaskClick}
                    refetch={refetch}
                    draggingTaskId={draggingTaskId}
                    setDraggingTaskId={setDraggingTaskId}
                    setTasksDragOver={setTasksDragOver}
                  />
                ))
              })()}
            </ul>
          </div>
        </>
      )}

      {middleSection != null ? (
        <>
          <div className="border-t border-border pt-4 mt-4" />
          {middleSection}
          <div className="border-t border-border pt-4 mt-4" />
        </>
      ) : (
        <div className="mt-5" aria-hidden />
      )}

      <button type="button" onClick={() => setHabitsCollapsed((c) => !c)} className={`w-full flex items-center justify-between gap-2 py-1.5 text-left font-semibold text-base text-text ${middleSection == null ? 'mt-0' : ''}`}>
        <span className="text-text">Habits</span>
        {habitsCollapsed ? <IconChevronDown size={22} /> : <IconChevronUp size={22} />}
      </button>
      <div className="w-full flex flex-col gap-0.5 pt-0.5 pb-0">
        <DayHabitsCounters dayStr={dayStr} habits={goodHabits} habitTracking={habitTracking} habitVariant="good" />
        <DayHabitsCounters dayStr={dayStr} habits={badHabits} habitTracking={habitTracking} habitVariant="bad" />
      </div>
      {!habitsCollapsed && (
        <div className="w-full space-y-3 mt-3">
          {goodHabits.length === 0 && badHabits.length === 0 && <p className="text-xs text-text-muted py-1">No habits</p>}
          {getHabitsByCategory([...goodHabits, ...badHabits]).map(([categoryLabel, habitsInCategory]) => (
            <div key={categoryLabel || '_habits'} className="space-y-0.5">
              {categoryLabel && <p className="text-xs font-medium text-text-muted px-0.5 py-0.5">{categoryLabel}</p>}
              <ul className="space-y-0.5 w-full">
                {habitsInCategory.map((habit) => (
                  <PlannerHabitRow key={habit.id} habit={habit} dayStr={dayStr} habitTracking={habitTracking} onToggle={onHabitToggle} />
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function PlannerHabitRow({ habit, dayStr, habitTracking, onToggle }) {
  const name = str(field(habit, 'Habit Name', 'Habit Name')) || '(untitled)'
  const entry = getHabitEntryForDay(habitTracking, habit.id, dayStr)
  const isDone = entry && isHabitEntrySuccessful(entry)

  const handleToggle = async (e) => {
    e.stopPropagation()
    try {
      await onToggle(habit.id, dayStr, isDone, entry?.id)
    } catch (err) {
      console.error(err)
    }
  }

  const boxStyle = { width: 15, height: 15, minWidth: 15, minHeight: 15, padding: 0 }

  return (
    <li className={`w-full min-h-0 ${isDone ? 'opacity-90' : ''}`}>
      <button
        type="button"
        onClick={handleToggle}
        aria-pressed={isDone}
        className="w-full flex items-center gap-2 py-0.5 text-left cursor-pointer rounded hover:bg-black/10 dark:hover:bg-white/5 transition-colors"
      >
        <span
          style={boxStyle}
          className={`shrink-0 self-center rounded-sm border flex items-center justify-center transition-colors ${
            isDone
              ? 'bg-primary border-primary text-white'
              : 'bg-surface border-border text-transparent'
          }`}
          aria-hidden
        >
          {isDone && <span className="text-[5px] leading-none">✓</span>}
        </span>
        <span className={`text-sm text-text truncate font-normal ${isDone ? 'line-through opacity-80' : ''}`}>{name}</span>
      </button>
    </li>
  )
}

export function PlannerPage() {
  const { fetchApi, invalidateCache } = usePlannerApi()
  const { data, loading, error, refetch, updateHabitTracking } = usePlannerData()
  const { tasks, habits, habitTracking } = data
  const todayStr = new Date().toISOString().slice(0, 10)
  const [weekOffset, setWeekOffset] = useState(0)
  const [mobileDateStr, setMobileDateStr] = useState(todayStr)
  const [touchStartX, setTouchStartX] = useState(null)
  const [modalTask, setModalTask] = useState(null)
  const [createTaskOpen, setCreateTaskOpen] = useState(false)
  const [desktopTasksCollapsed, setDesktopTasksCollapsed] = useState(false)
  const [habitsCollapsed, setHabitsCollapsed] = useState(() => readPlannerPrefs().habitsCollapsed)
  const [showCompleted, setShowCompleted] = useState(() => readPlannerPrefs().showCompleted)
  const [eventsCollapsed, setEventsCollapsed] = useState(() => readPlannerPrefs().eventsCollapsed)
  const [showFullDay, setShowFullDay] = useState(() => readPlannerPrefs().showFullDay)
  const [calendarEvents, setCalendarEvents] = useState([])
  const [calendarEventsLoading, setCalendarEventsLoading] = useState(true)
  const [createEventOpen, setCreateEventOpen] = useState(false)
  const [editEvent, setEditEvent] = useState(null)
  const [fabMenuOpen, setFabMenuOpen] = useState(false)

  useEffect(() => {
    writePlannerPrefs({ habitsCollapsed, showCompleted, eventsCollapsed, showFullDay })
  }, [habitsCollapsed, showCompleted, eventsCollapsed, showFullDay])

  const weekDays = getWeekDaysForOffset(weekOffset)
  const timeMin = weekDays[0] ? `${weekDays[0]}T00:00:00` : ''
  const timeMax = weekDays[6] ? `${weekDays[6]}T23:59:59` : ''
  const refetchCalendarEvents = useCallback(() => {
    if (!timeMin || !timeMax) return Promise.resolve()
    setCalendarEventsLoading(true)
    const url = `/api/calendar/events?timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}`
    return fetchApi(url)
      .then((r) => {
        const list = Array.isArray(r?.data) ? r.data : []
        setCalendarEvents(list)
        return list
      })
      .catch(() => {
        setCalendarEvents([])
        throw new Error('Failed to refetch calendar events')
      })
      .finally(() => setCalendarEventsLoading(false))
  }, [timeMin, timeMax, fetchApi])

  const refreshCalendarEvents = useCallback(() => {
    invalidateCache('/api/calendar/events')
    return refetchCalendarEvents()
  }, [invalidateCache, refetchCalendarEvents])

  const handleRefresh = useCallback(() => {
    invalidateCache()
    refetch()
    refetchCalendarEvents()
  }, [invalidateCache, refetch, refetchCalendarEvents])

  useEffect(() => {
    refetchCalendarEvents()
  }, [refetchCalendarEvents])

  const mobileWeekDays = getWeekDays(parseLocalDate(mobileDateStr))
  const mobileDayIndex = getWeekdayIndex(mobileDateStr)

  const handleTouchStart = (e) => {
    setTouchStartX(e.targetTouches[0].clientX)
  }
  const handleTouchEnd = (e) => {
    if (touchStartX == null) return
    const endX = e.changedTouches[0].clientX
    const diff = touchStartX - endX
    if (Math.abs(diff) > 50) {
      if (diff > 0) setMobileDateStr((d) => addDays(d, 1))
      else setMobileDateStr((d) => addDays(d, -1))
    }
    setTouchStartX(null)
  }

  const handleTaskDelete = useCallback(
    async (taskId) => {
      await fetchApi(`/api/tasks/${taskId}`, { method: 'DELETE' })
      refetch()
      setModalTask((current) => (current?.id === taskId ? null : current))
    },
    [fetchApi, refetch]
  )

  const handleTaskStatusChange = useCallback(
    async (taskId, status) => {
      await fetchApi(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        body: JSON.stringify({ Status: status }),
      })
    },
    [fetchApi]
  )

  const handleTaskUpdate = useCallback(
    async (taskId, fields) => {
      try {
        await fetchApi(`/api/tasks/${taskId}`, {
          method: 'PATCH',
          body: JSON.stringify(fields),
        })
        await refetch()
      } catch (err) {
        console.error(err)
      }
    },
    [fetchApi, refetch]
  )

  const handleTaskMove = useCallback(
    async (taskId, newDayStr) => {
      try {
        await fetchApi(`/api/tasks/${taskId}`, {
          method: 'PATCH',
          body: JSON.stringify({ 'Due Date': newDayStr }),
        })
        await refetch()
      } catch (err) {
        console.error(err)
      }
    },
    [fetchApi, refetch]
  )

  const handleCreateTask = useCallback(
    async (fields) => {
      await fetchApi('/api/tasks', {
        method: 'POST',
        body: JSON.stringify(fields),
      })
      await refetch()
    },
    [fetchApi, refetch]
  )

  const handleHabitToggle = useCallback(
    async (habitId, date, currentlyDone, entryId) => {
      try {
        if (currentlyDone && entryId) {
          const res = await fetchApi(`/api/habit-tracking/${entryId}`, {
            method: 'PATCH',
            body: JSON.stringify({ 'Was Successful?': false }),
          })
          if (res?.data) {
            updateHabitTracking((prev) =>
              prev.map((e) => (e.id === entryId ? res.data : e))
            )
          }
        } else if (entryId) {
          const res = await fetchApi(`/api/habit-tracking/${entryId}`, {
            method: 'PATCH',
            body: JSON.stringify({ 'Was Successful?': true }),
          })
          if (res?.data) {
            updateHabitTracking((prev) =>
              prev.map((e) => (e.id === entryId ? res.data : e))
            )
          }
        } else {
          const res = await fetchApi('/api/habit-tracking', {
            method: 'POST',
            body: JSON.stringify({ Habit: habitId, date }),
          })
          if (res?.data) {
            updateHabitTracking((prev) => [...prev, res.data])
          }
        }
      } catch (err) {
        console.error(err)
      }
    },
    [fetchApi, updateHabitTracking]
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
        <PageHeader breadcrumbs={[{ label: 'Planner', to: '/' }]} />
        <div className="rounded-2xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-6">
          <p className="text-red-700 dark:text-red-300">{error}</p>
        </div>
      </div>
    )
  }

  const goodHabits = filterHabitsByType(habits, 'Good')
  const badHabits = filterHabitsByType(habits, 'Bad')

  const dayColumnPrefs = {
    habitsCollapsed,
    showCompleted,
    onHabitsCollapsedChange: setHabitsCollapsed,
    onShowCompletedChange: setShowCompleted,
  }
  const dayColumns = weekDays.map((dayStr, i) => (
    <DayColumn
      key={dayStr}
      dayStr={dayStr}
      dayIndex={i}
      tasks={tasks}
      habits={habits}
      goodHabits={goodHabits}
      badHabits={badHabits}
      habitTracking={habitTracking}
      onTaskStatusChange={handleTaskStatusChange}
      onHabitToggle={handleHabitToggle}
      onTaskClick={setModalTask}
      onTaskMove={handleTaskMove}
      refetch={refetch}
      hideDayHeader
      {...dayColumnPrefs}
    />
  ))
  const mobileEventsSection = (
    <div className="pt-4 mt-4">
      <button
        type="button"
        onClick={() => setEventsCollapsed((c) => !c)}
        className="w-full flex items-center justify-between gap-2 py-2 text-left font-semibold text-base text-text"
      >
        <span className="text-text">Events</span>
        <span className="flex items-center gap-3 shrink-0">
          <span onClick={(e) => e.stopPropagation()}>
            <Switch checked={showFullDay} onChange={setShowFullDay} label="Show full day" />
          </span>
          {eventsCollapsed ? <IconChevronDown size={22} /> : <IconChevronUp size={22} />}
        </span>
      </button>
      {!eventsCollapsed && (
        <div className="mt-2 min-h-[200px] flex gap-2">
          {calendarEventsLoading && calendarEvents.length === 0 ? (
            <p className="text-text-muted text-sm py-4">Loading events…</p>
          ) : (
            <>
              <div className="shrink-0 min-w-[3rem] w-14">
                <EventsTimeLabelsColumn
                  startHour={showFullDay ? EVENTS_FULL_DAY_START_HOUR : EVENTS_DEFAULT_START_HOUR}
                  endHour={showFullDay ? EVENTS_FULL_DAY_END_HOUR : EVENTS_DEFAULT_END_HOUR}
                />
              </div>
              <div className="flex-1 min-w-0">
                <DayEventsColumn
                  dayStr={mobileDateStr}
                  events={calendarEvents}
                  showTimeLabels={false}
                  startHour={showFullDay ? EVENTS_FULL_DAY_START_HOUR : EVENTS_DEFAULT_START_HOUR}
                  endHour={showFullDay ? EVENTS_FULL_DAY_END_HOUR : EVENTS_DEFAULT_END_HOUR}
                  onEventClick={setEditEvent}
                />
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )

  const mobileDayColumns = mobileWeekDays.map((dayStr, i) => (
    <DayColumn
      key={dayStr}
      dayStr={dayStr}
      dayIndex={i}
      tasks={tasks}
      habits={habits}
      goodHabits={goodHabits}
      badHabits={badHabits}
      habitTracking={habitTracking}
      onTaskStatusChange={handleTaskStatusChange}
      onHabitToggle={handleHabitToggle}
      onTaskClick={setModalTask}
      onTaskMove={handleTaskMove}
      refetch={refetch}
      hideDayHeader
      middleSection={mobileEventsSection}
      {...dayColumnPrefs}
    />
  ))

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={[{ label: 'Planner', to: '/' }]}
        onRefresh={handleRefresh}
        loading={loading}
      />

      {/* Desktop: layout agrupado (días en fila, luego Tasks en bloque, luego Habits en bloque) */}
      <div className="hidden md:block space-y-0">
        <div className="grid grid-cols-7 gap-3 border-b border-border pb-3 items-stretch">
          {weekDays.map((dayStr, i) => (
            <div key={dayStr} className="flex items-center gap-1 min-w-0">
              {i === 0 && (
                <button
                  type="button"
                  onClick={() => setWeekOffset((o) => o - 1)}
                  aria-label="Previous week"
                  className="shrink-0 p-1.5 rounded-lg text-text-muted hover:bg-border hover:text-text"
                >
                  <IconChevronLeft size={20} />
                </button>
              )}
              <div className="flex-1 min-w-0">
                <DayHeaderCell
                  dayStr={dayStr}
                  dayIndex={i}
                  tasks={tasks}
                  habits={habits}
                  habitTracking={habitTracking}
                />
              </div>
              {i === 6 && (
                <button
                  type="button"
                  onClick={() => setWeekOffset((o) => o + 1)}
                  aria-label="Next week"
                  className="shrink-0 p-1.5 rounded-lg text-text-muted hover:bg-border hover:text-text"
                >
                  <IconChevronRight size={20} />
                </button>
              )}
            </div>
          ))}
        </div>
        <div className="mt-4">
          <button
            type="button"
            onClick={() => setDesktopTasksCollapsed((c) => !c)}
            className="w-full flex items-center justify-between gap-3 py-2 text-left font-semibold text-base text-text"
          >
            <span>Tasks</span>
            <span className="flex items-center gap-3 shrink-0">
              {!desktopTasksCollapsed && (
                <Switch checked={showCompleted} onChange={setShowCompleted} label="Show completed" />
              )}
              {desktopTasksCollapsed ? <IconChevronDown size={22} /> : <IconChevronUp size={22} />}
            </span>
          </button>
          {desktopTasksCollapsed ? (
            <div className="grid grid-cols-7 gap-3 mt-2">
              {weekDays.map((dayStr) => (
                <DayTaskProgressBar key={dayStr} dayStr={dayStr} tasks={tasks} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-3 mt-2 min-h-[120px]">
              {weekDays.map((dayStr) => (
                <DayTasksColumn
                  key={dayStr}
                  dayStr={dayStr}
                  tasks={tasks}
                  showCompleted={showCompleted}
                  onTaskStatusChange={handleTaskStatusChange}
                  onTaskClick={setModalTask}
                  onTaskMove={handleTaskMove}
                  refetch={refetch}
                />
              ))}
            </div>
          )}
        </div>
        <div className="mt-6 pt-4 border-t border-border">
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setEventsCollapsed((c) => !c)}
              className="flex-1 flex items-center justify-between gap-2 py-2 text-left font-semibold text-base text-text"
            >
              <span className="text-text">Events</span>
              <span className="flex items-center gap-3 shrink-0">
                {!eventsCollapsed && (
                  <span onClick={(e) => e.stopPropagation()}>
                    <Switch checked={showFullDay} onChange={setShowFullDay} label="Show full day" />
                  </span>
                )}
                {eventsCollapsed ? <IconChevronDown size={22} /> : <IconChevronUp size={22} />}
              </span>
            </button>
          </div>
          {eventsCollapsed ? (
            <div className="grid grid-cols-7 gap-3 mt-2">
              {weekDays.map((dayStr) => (
                <DayEventsSummary key={dayStr} dayStr={dayStr} events={calendarEvents} />
              ))}
            </div>
          ) : (
            <div className="flex gap-3 mt-2 min-h-[200px]">
              {calendarEventsLoading && calendarEvents.length === 0 ? (
                <p className="text-text-muted text-sm py-4">Loading events…</p>
              ) : (
                <>
                  <EventsTimeLabelsColumn
                    startHour={showFullDay ? EVENTS_FULL_DAY_START_HOUR : EVENTS_DEFAULT_START_HOUR}
                    endHour={showFullDay ? EVENTS_FULL_DAY_END_HOUR : EVENTS_DEFAULT_END_HOUR}
                  />
                  <div className="grid grid-cols-7 gap-3 flex-1 min-w-0">
                    {weekDays.map((dayStr) => (
                      <DayEventsColumn
                        key={dayStr}
                        dayStr={dayStr}
                        events={calendarEvents}
                        showTimeLabels={false}
                        startHour={showFullDay ? EVENTS_FULL_DAY_START_HOUR : EVENTS_DEFAULT_START_HOUR}
                        endHour={showFullDay ? EVENTS_FULL_DAY_END_HOUR : EVENTS_DEFAULT_END_HOUR}
                        onEventClick={setEditEvent}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
        <div className="mt-6 pt-4 border-t border-border">
          <button
            type="button"
            onClick={() => setHabitsCollapsed((c) => !c)}
            className="w-full flex items-center justify-between gap-2 py-2 text-left font-semibold text-base text-text"
          >
            <span className="text-text">Habits</span>
            {habitsCollapsed ? <IconChevronDown size={22} /> : <IconChevronUp size={22} />}
          </button>
          {habitsCollapsed ? (
            <div className="grid grid-cols-7 gap-3 mt-2">
              {weekDays.map((dayStr) => (
                <div key={dayStr} className="flex flex-col gap-0.5">
                  <DayHabitsCounters
                    dayStr={dayStr}
                    habits={goodHabits}
                    habitTracking={habitTracking}
                    habitVariant="good"
                  />
                  <DayHabitsCounters
                    dayStr={dayStr}
                    habits={badHabits}
                    habitTracking={habitTracking}
                    habitVariant="bad"
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-3 mt-2 min-h-[80px]">
              {weekDays.map((dayStr) => (
                <DayHabitsColumn
                  key={dayStr}
                  dayStr={dayStr}
                  goodHabits={goodHabits}
                  badHabits={badHabits}
                  allHabits={[...goodHabits, ...badHabits]}
                  habitTracking={habitTracking}
                  onHabitToggle={handleHabitToggle}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="md:hidden">
        <div className="flex items-center justify-between gap-2 mb-3">
          <button
            type="button"
            aria-label="Previous day"
            onClick={() => setMobileDateStr((d) => addDays(d, -1))}
            className="min-h-[44px] min-w-[44px] rounded-xl border-2 border-border bg-surface text-text flex items-center justify-center shrink-0"
          >
            <IconChevronLeft size={22} />
          </button>
          <span className="font-semibold text-text truncate text-center">
            {DAY_NAMES[mobileDayIndex]} {formatDayDate(mobileDateStr)}
          </span>
          <button
            type="button"
            aria-label="Next day"
            onClick={() => setMobileDateStr((d) => addDays(d, 1))}
            className="min-h-[44px] min-w-[44px] rounded-xl border-2 border-border bg-surface text-text flex items-center justify-center shrink-0"
          >
            <IconChevronRight size={22} />
          </button>
        </div>
        <div
          className="overflow-hidden touch-pan-y"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {mobileDayColumns[mobileDayIndex]}
        </div>
      </div>

      {modalTask && (
        <TaskModal
          task={tasks.find((t) => t.id === modalTask.id) || modalTask}
          onClose={() => setModalTask(null)}
          onStatusChange={handleTaskStatusChange}
          onTaskUpdate={handleTaskUpdate}
          onTaskDelete={handleTaskDelete}
          refetch={refetch}
        />
      )}

      {createTaskOpen && (
        <TaskModal
          task={null}
          onClose={() => setCreateTaskOpen(false)}
          onCreate={handleCreateTask}
          refetch={refetch}
          initialValues={{ 'Due Date': todayStr }}
        />
      )}

      {(createEventOpen || editEvent) && (
        <EventModal
          event={editEvent}
          onClose={() => {
            setCreateEventOpen(false)
            setEditEvent(null)
          }}
          onRefetch={refreshCalendarEvents}
        />
      )}

      <div className="fixed z-40 right-4 md:right-8 bottom-[6rem] md:bottom-8 flex flex-col items-end gap-2">
        {fabMenuOpen && (
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => {
                setCreateTaskOpen(true)
                setFabMenuOpen(false)
              }}
              className="min-h-[44px] px-4 rounded-full shadow-lg bg-surface border-2 border-border text-text font-medium hover:bg-surface-hover flex items-center gap-2"
            >
              <IconCheckSquare size={20} />
              New task
            </button>
            <button
              type="button"
              onClick={() => {
                setCreateEventOpen(true)
                setFabMenuOpen(false)
              }}
              className="min-h-[44px] px-4 rounded-full shadow-lg bg-surface border-2 border-border text-text font-medium hover:bg-surface-hover flex items-center gap-2"
            >
              <IconCalendar size={20} />
              New event
            </button>
          </div>
        )}
        <Fab
          onClick={() => setFabMenuOpen((open) => !open)}
          ariaLabel={fabMenuOpen ? 'Close menu' : 'Create'}
          variant={fabMenuOpen ? 'close' : 'add'}
          className="!relative !right-0 !bottom-0"
        />
      </div>
    </div>
  )
}
