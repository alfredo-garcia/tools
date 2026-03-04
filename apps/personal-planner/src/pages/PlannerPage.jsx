import { useState, useEffect, useCallback } from 'react'
import { usePlannerApi } from '../contexts/PlannerApiContext'
import { Spinner, PageHeader, Switch, IconChevronDown, IconChevronUp, IconChevronLeft, IconChevronRight, IconStar, IconFlameFilled, IconPoop, IconTarget, IconCalendar, IconUser, IconTag, IconCircle, IconPlay, IconCheckSquare, IconTrash, IconHeart, IconHeartFire, IconX } from '@tools/shared'
import { field, str, dateStr, arr, getWeekDays, getWeekStart, getWeekdayIndex } from '@tools/shared'
import { getTaskStatusGroup } from '../lib/taskStatus'
import { TaskCard, STATUS_OPTIONS, getPriorityTagClass } from '../components/TaskCard'
import { TaskModal } from '../components/TaskModal'
import { Fab } from '@tools/shared'

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
  if (typeof window === 'undefined') return { goodHabitsCollapsed: false, badHabitsCollapsed: false, showCompleted: false }
  try {
    const raw = localStorage.getItem(PLANNER_PREFS_KEY)
    if (!raw) return { goodHabitsCollapsed: false, badHabitsCollapsed: false, showCompleted: false }
    const p = JSON.parse(raw)
    return {
      goodHabitsCollapsed: Boolean(p.goodHabitsCollapsed),
      badHabitsCollapsed: Boolean(p.badHabitsCollapsed),
      showCompleted: Boolean(p.showCompleted),
    }
  } catch (_) {
    return { goodHabitsCollapsed: false, badHabitsCollapsed: false, showCompleted: false }
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
      fetchApi('/api/tasks').then((r) => r.data || []),
      fetchApi('/api/habits').then((r) => r.data || []),
      fetchApi('/api/habit-tracking').then((r) => r.data || []),
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

/** Group habits by category. '' key = uncategorized. Order: named categories first (A–Z), uncategorized last. */
function getHabitsByCategory(habits) {
  const map = new Map()
  for (const h of habits) {
    const cat = str(field(h, 'Category', 'Category')) || ''
    if (!map.has(cat)) map.set(cat, [])
    map.get(cat).push(h)
  }
  const withName = [...map.entries()].filter(([k]) => k !== '').sort((a, b) => a[0].localeCompare(b[0]))
  const withoutName = map.get('') || []
  return withoutName.length ? [...withName, ['', withoutName]] : withName
}

/** Filtra hábitos por columna "Habit type" (o "Habit Type"). type = "Good" | "Bad" (case-insensitive). */
function filterHabitsByType(habits, type) {
  const want = String(type).trim().toLowerCase()
  return habits.filter((h) => {
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
          <li
            key={task.id}
            className="w-full cursor-grab active:cursor-grabbing"
            draggable
            onDragStart={(e) => handleDragStart(e, task)}
            onDragEnd={handleDragEnd}
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
        ))}
      </ul>
    </div>
  )
}

/** Solo la fila de contadores (1–5) para un día. Para mostrar cuando la sección Habits está colapsada. */
function DayHabitsCounters({ dayStr, habits, habitTracking, habitVariant = 'good' }) {
  const habitsDoneCount = habits.filter((h) => {
    const entry = getHabitEntryForDay(habitTracking, h.id, dayStr)
    return entry && isHabitEntrySuccessful(entry)
  }).length
  const isGood = habitVariant === 'good'
  const CounterIcon = (n) => (n === 5 ? (isGood ? IconHeartFire : IconX) : (isGood ? IconHeart : IconX))
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

/** Per-day habits column (counter + list by category). habitVariant: 'good' = hearts (green), 'bad' = X (red). No collapse. */
function DayHabitsColumn({ dayStr, habits, habitTracking, onHabitToggle, habitVariant = 'good' }) {
  return (
    <div className="flex flex-col min-w-0 px-2">
      <DayHabitsCounters dayStr={dayStr} habits={habits} habitTracking={habitTracking} habitVariant={habitVariant} />
      <div className="w-full space-y-3 mt-3">
        {habits.length === 0 && <p className="text-xs text-text-muted py-1">No habits</p>}
        {getHabitsByCategory(habits).map(([categoryLabel, habitsInCategory]) => (
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
  goodHabitsCollapsed: controlledGoodHabitsCollapsed,
  badHabitsCollapsed: controlledBadHabitsCollapsed,
  showCompleted: controlledShowCompleted,
  onGoodHabitsCollapsedChange,
  onBadHabitsCollapsedChange,
  onShowCompletedChange,
}) {
  const [tasksCollapsed, setTasksCollapsed] = useState(false)
  const [localGoodHabitsCollapsed, setLocalGoodHabitsCollapsed] = useState(false)
  const [localBadHabitsCollapsed, setLocalBadHabitsCollapsed] = useState(false)
  const [localShowCompleted, setLocalShowCompleted] = useState(false)
  const [tasksDragOver, setTasksDragOver] = useState(false)
  const [draggingTaskId, setDraggingTaskId] = useState(null)

  const goodHabitsCollapsed = onGoodHabitsCollapsedChange != null ? controlledGoodHabitsCollapsed : localGoodHabitsCollapsed
  const badHabitsCollapsed = onBadHabitsCollapsedChange != null ? controlledBadHabitsCollapsed : localBadHabitsCollapsed
  const showCompleted = onShowCompletedChange != null ? controlledShowCompleted : localShowCompleted
  const setGoodHabitsCollapsed = onGoodHabitsCollapsedChange ?? setLocalGoodHabitsCollapsed
  const setBadHabitsCollapsed = onBadHabitsCollapsedChange ?? setLocalBadHabitsCollapsed
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
  const habitsDoneCount = habits.filter((h) => {
    const entry = getHabitEntryForDay(habitTracking, h.id, dayStr)
    return entry && isHabitEntrySuccessful(entry)
  }).length
  const goodHabitsDoneCount = goodHabits.filter((h) => {
    const entry = getHabitEntryForDay(habitTracking, h.id, dayStr)
    return entry && isHabitEntrySuccessful(entry)
  }).length
  const badHabitsDoneCount = badHabits.filter((h) => {
    const entry = getHabitEntryForDay(habitTracking, h.id, dayStr)
    return entry && isHabitEntrySuccessful(entry)
  }).length
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
                  <li
                    key={task.id}
                    className="w-full cursor-grab active:cursor-grabbing"
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData(DRAG_TYPE_TASK, JSON.stringify({ taskId: task.id, fromDayStr: dayStr }))
                      e.dataTransfer.effectAllowed = 'move'
                      setDraggingTaskId(task.id)
                    }}
                    onDragEnd={() => setTimeout(() => setDraggingTaskId(null), 100)}
                  >
                    <TaskCard task={task} dayStr={dayStr} onStatusChange={onTaskStatusChange} onOpenModal={onTaskClick} refetch={refetch} isDragging={draggingTaskId === task.id} />
                  </li>
                ))
              })()}
            </ul>
          </div>
        </>
      )}

      <button type="button" onClick={() => setGoodHabitsCollapsed((c) => !c)} className="w-full flex items-center justify-between gap-2 py-1.5 text-left font-semibold text-base text-text mt-5">
        <span className="text-text">Good Habits</span>
        {goodHabitsCollapsed ? <IconChevronDown size={22} /> : <IconChevronUp size={22} />}
      </button>
      <div className="w-full pt-0.5 pb-0 flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((n) => (
          <span key={n} className={`shrink-0 ${n <= goodHabitsDoneCount ? (n === 5 ? 'text-green-600' : 'text-green-500') : 'text-border'}`} title={n === 5 ? '5+ habits' : `Point ${n}`}>
            {n === 5 ? <IconHeartFire size={18} /> : <IconHeart size={14} />}
          </span>
        ))}
      </div>
      {!goodHabitsCollapsed && (
        <>
          <div className="w-full space-y-3 mt-3">
            {goodHabits.length === 0 && <p className="text-xs text-text-muted py-1">No good habits</p>}
            {getHabitsByCategory(goodHabits).map(([categoryLabel, habitsInCategory]) => (
              <div key={categoryLabel || '_good'} className="space-y-0.5">
                {categoryLabel && <p className="text-xs font-medium text-text-muted px-0.5 py-0.5">{categoryLabel}</p>}
                <ul className="space-y-0.5 w-full">
                  {habitsInCategory.map((habit) => (
                    <PlannerHabitRow key={habit.id} habit={habit} dayStr={dayStr} habitTracking={habitTracking} onToggle={onHabitToggle} />
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </>
      )}

      <button type="button" onClick={() => setBadHabitsCollapsed((c) => !c)} className="w-full flex items-center justify-between gap-2 py-1.5 text-left font-semibold text-base text-text mt-5">
        <span className="text-text">Bad Habits</span>
        {badHabitsCollapsed ? <IconChevronDown size={22} /> : <IconChevronUp size={22} />}
      </button>
      <div className="w-full pt-0.5 pb-0 flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((n) => (
          <span key={n} className={`shrink-0 ${n <= badHabitsDoneCount ? (n === 5 ? 'text-red-600' : 'text-red-500') : 'text-border'}`} title={n === 5 ? '5+ habits' : `Point ${n}`}>
            <IconX size={n === 5 ? 18 : 14} />
          </span>
        ))}
      </div>
      {!badHabitsCollapsed && (
        <>
          <div className="w-full space-y-3 mt-3">
            {badHabits.length === 0 && <p className="text-xs text-text-muted py-1">No bad habits</p>}
            {getHabitsByCategory(badHabits).map(([categoryLabel, habitsInCategory]) => (
              <div key={categoryLabel || '_bad'} className="space-y-0.5">
                {categoryLabel && <p className="text-xs font-medium text-text-muted px-0.5 py-0.5">{categoryLabel}</p>}
                <ul className="space-y-0.5 w-full">
                  {habitsInCategory.map((habit) => (
                    <PlannerHabitRow key={habit.id} habit={habit} dayStr={dayStr} habitTracking={habitTracking} onToggle={onHabitToggle} />
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </>
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
  const handleRefresh = useCallback(() => {
    invalidateCache()
    refetch()
  }, [invalidateCache, refetch])
  const { tasks, habits, habitTracking } = data
  const todayStr = new Date().toISOString().slice(0, 10)
  const [weekOffset, setWeekOffset] = useState(0)
  const [mobileDateStr, setMobileDateStr] = useState(todayStr)
  const [touchStartX, setTouchStartX] = useState(null)
  const [modalTask, setModalTask] = useState(null)
  const [createTaskOpen, setCreateTaskOpen] = useState(false)
  const [desktopTasksCollapsed, setDesktopTasksCollapsed] = useState(false)
  const [goodHabitsCollapsed, setGoodHabitsCollapsed] = useState(() => readPlannerPrefs().goodHabitsCollapsed)
  const [badHabitsCollapsed, setBadHabitsCollapsed] = useState(() => readPlannerPrefs().badHabitsCollapsed)
  const [showCompleted, setShowCompleted] = useState(() => readPlannerPrefs().showCompleted)

  useEffect(() => {
    writePlannerPrefs({ goodHabitsCollapsed, badHabitsCollapsed, showCompleted })
  }, [goodHabitsCollapsed, badHabitsCollapsed, showCompleted])

  const weekDays = getWeekDaysForOffset(weekOffset)
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
    goodHabitsCollapsed,
    badHabitsCollapsed,
    showCompleted,
    onGoodHabitsCollapsedChange: setGoodHabitsCollapsed,
    onBadHabitsCollapsedChange: setBadHabitsCollapsed,
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
        <div className="mt-6 pt-4 border-t border-border space-y-4">
          <div>
            <button
              type="button"
              onClick={() => setGoodHabitsCollapsed((c) => !c)}
              className="w-full flex items-center justify-between gap-2 py-2 text-left font-semibold text-base text-text"
            >
              <span className="text-text">Good Habits</span>
              {goodHabitsCollapsed ? <IconChevronDown size={22} /> : <IconChevronUp size={22} />}
            </button>
            {goodHabitsCollapsed ? (
              <div className="grid grid-cols-7 gap-3 mt-2">
                {weekDays.map((dayStr) => (
                  <DayHabitsCounters
                    key={dayStr}
                    dayStr={dayStr}
                    habits={goodHabits}
                    habitTracking={habitTracking}
                    habitVariant="good"
                  />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-7 gap-3 mt-2 min-h-[80px]">
                {weekDays.map((dayStr) => (
                  <DayHabitsColumn
                    key={dayStr}
                    dayStr={dayStr}
                    habits={goodHabits}
                    habitTracking={habitTracking}
                    onHabitToggle={handleHabitToggle}
                    habitVariant="good"
                  />
                ))}
              </div>
            )}
          </div>
          <div>
            <button
              type="button"
              onClick={() => setBadHabitsCollapsed((c) => !c)}
              className="w-full flex items-center justify-between gap-2 py-2 text-left font-semibold text-base text-text"
            >
              <span className="text-text">Bad Habits</span>
              {badHabitsCollapsed ? <IconChevronDown size={22} /> : <IconChevronUp size={22} />}
            </button>
            {badHabitsCollapsed ? (
              <div className="grid grid-cols-7 gap-3 mt-2">
                {weekDays.map((dayStr) => (
                  <DayHabitsCounters
                    key={dayStr}
                    dayStr={dayStr}
                    habits={badHabits}
                    habitTracking={habitTracking}
                    habitVariant="bad"
                  />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-7 gap-3 mt-2 min-h-[80px]">
                {weekDays.map((dayStr) => (
                  <DayHabitsColumn
                    key={dayStr}
                    dayStr={dayStr}
                    habits={badHabits}
                    habitTracking={habitTracking}
                    onHabitToggle={handleHabitToggle}
                    habitVariant="bad"
                  />
                ))}
              </div>
            )}
          </div>
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

      <Fab onClick={() => setCreateTaskOpen(true)} ariaLabel="Create task" />
    </div>
  )
}
