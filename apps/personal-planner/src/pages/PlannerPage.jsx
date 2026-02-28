import { useState, useEffect, useCallback } from 'react'
import { useApi, Spinner, PageHeader, Switch, IconChevronDown, IconChevronUp, IconChevronLeft, IconChevronRight, IconStar, IconFlameFilled, IconTarget, IconCalendar, IconUser, IconTag, IconCircle, IconPlay, IconCheckSquare, IconTrash, IconSaint, IconDevil } from '@tools/shared'
import { field, str, dateStr, arr, getWeekDays, getWeekStart, getWeekdayIndex } from '@tools/shared'
import { getTaskStatusGroup } from '../lib/taskStatus'
import { TaskCard, STATUS_OPTIONS, getPriorityTagClass } from '../components/TaskCard'
import { TaskModal } from '../components/TaskModal'
import { Fab } from '@tools/shared'

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const MIN_HABITS_FOR_FIRE = 5

function getWeekDaysForOffset(weekOffset) {
  const start = getWeekStart(new Date())
  start.setDate(start.getDate() + weekOffset * 7)
  return getWeekDays(start)
}

function addDays(dateStr, delta) {
  const d = new Date(dateStr + 'T12:00:00')
  d.setDate(d.getDate() + delta)
  return d.toISOString().slice(0, 10)
}

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

function formatDayDate(dayStr) {
  if (!dayStr) return ''
  const d = new Date(dayStr + 'T12:00:00')
  return `${d.getDate()} ${MONTH_NAMES[d.getMonth()]}`
}

function dayHeaderStars(tasksForDay, habits, habitTracking, dayStr) {
  const totalTasks = tasksForDay.length
  const tasksDone = tasksForDay.filter((t) => getTaskStatusGroup(t) === 'done').length
  const allTasksDone = totalTasks > 0 && tasksDone === totalTasks
  const habitsDoneCount = habits.filter((h) => {
    const entry = getHabitEntryForDay(habitTracking, h.id, dayStr)
    return entry && isHabitEntrySuccessful(entry)
  }).length
  const hasFire = allTasksDone && habitsDoneCount >= MIN_HABITS_FOR_FIRE
  const hasStar = allTasksDone
  return { hasStar, hasFire }
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
  const { hasStar, hasFire } = dayHeaderStars(tasksForDay, habits, habitTracking, dayStr)
  const dayLabel = DAY_NAMES[dayIndex]
  return (
    <div className="py-2 shrink-0 flex items-center justify-between gap-2 px-2 min-w-0">
      <div className="min-w-0">
        <div className="font-bold text-text truncate">{dayLabel}</div>
        <div className="text-sm text-text-muted">{formatDayDate(dayStr)}</div>
      </div>
      <div className="flex items-center gap-0.5 shrink-0">
        {hasStar && (
          <span className="text-amber-500" title={hasFire ? 'Tasks + 5+ habits' : 'All tasks done'}>
            <IconStar size={18} />
          </span>
        )}
        {hasFire && (
          <span className="text-orange-500" title="5+ habits">
            <IconFlameFilled size={22} />
          </span>
        )}
      </div>
    </div>
  )
}

/** Columna de tasks de un día (header + barra + lista). Sin collapse.
 * showCompleted: si true, se muestran las Done al final.
 */
function DayTasksColumn({ dayStr, tasks, showCompleted = false, onTaskStatusChange, onTaskClick, refetch }) {
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
  return (
    <div className="flex flex-col min-w-0 px-2">
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
          <li key={task.id} className="w-full">
            <TaskCard task={task} dayStr={dayStr} onStatusChange={onTaskStatusChange} onOpenModal={onTaskClick} refetch={refetch} />
          </li>
        ))}
      </ul>
    </div>
  )
}

/** Per-day habits column (stars + list by category). No collapse. */
function DayHabitsColumn({ dayStr, habits, habitTracking, onHabitToggle, refetch }) {
  const habitsDoneCount = habits.filter((h) => {
    const entry = getHabitEntryForDay(habitTracking, h.id, dayStr)
    return entry && isHabitEntrySuccessful(entry)
  }).length
  return (
    <div className="flex flex-col min-w-0 px-2">
      <div className="w-full pt-0.5 pb-0 flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((n) => (
          <span
            key={n}
            className={`shrink-0 ${n <= habitsDoneCount ? (n === 5 ? 'text-orange-500' : 'text-amber-500') : 'text-border'}`}
            title={n === 5 ? '5+ habits' : `Point ${n}`}
          >
            {n === 5 ? <IconFlameFilled size={16} /> : <IconStar size={14} />}
          </span>
        ))}
      </div>
      <div className="w-full space-y-3 mt-3">
        {habits.length === 0 && <p className="text-xs text-text-muted py-1">No habits</p>}
        {getHabitsByCategory(habits).map(([categoryLabel, habitsInCategory]) => (
          <div key={categoryLabel || '_sin_categoria'} className="space-y-0.5">
            {categoryLabel && <p className="text-xs font-medium text-text-muted px-0.5 py-0.5">{categoryLabel}</p>}
            <ul className="space-y-0.5 w-full">
              {habitsInCategory.map((habit) => (
                <PlannerHabitRow key={habit.id} habit={habit} dayStr={dayStr} habitTracking={habitTracking} onToggle={onHabitToggle} refetch={refetch} />
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
  refetch,
  hideDayHeader = false,
}) {
  const [tasksCollapsed, setTasksCollapsed] = useState(false)
  const [goodHabitsCollapsed, setGoodHabitsCollapsed] = useState(false)
  const [badHabitsCollapsed, setBadHabitsCollapsed] = useState(false)
  const [showCompleted, setShowCompleted] = useState(false)

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
  const { hasStar, hasFire } = dayHeaderStars(tasksForDay, habits, habitTracking, dayStr)
  const dayLabel = DAY_NAMES[dayIndex]

  return (
    <div className="flex flex-col min-w-0 overflow-y-auto overflow-x-hidden px-2">
      {!hideDayHeader && (
        <div className="py-2 shrink-0 flex items-center justify-between gap-2">
          <div>
            <div className="font-bold text-text">{dayLabel}</div>
            <div className="text-sm text-text-muted">{formatDayDate(dayStr)}</div>
          </div>
          <div className="flex items-center gap-0.5 shrink-0">
            {hasStar && (
              <span className="text-amber-500" title={hasFire ? 'Tasks done + 5+ habits' : 'All tasks done'}>
                <IconStar size={18} />
              </span>
            )}
            {hasFire && (
              <span className="text-orange-500" title="5+ habits">
                <IconFlameFilled size={22} />
              </span>
            )}
          </div>
        </div>
      )}

      <button type="button" onClick={() => setTasksCollapsed((c) => !c)} className="w-full flex items-center justify-between gap-2 py-1.5 text-left font-semibold text-base text-text">
        <span>Tasks</span>
        {tasksCollapsed ? <IconChevronDown size={22} /> : <IconChevronUp size={22} />}
      </button>
      {!tasksCollapsed && (
        <>
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
          <ul className="space-y-2 w-full mt-3">
            {tasksForDay.length === 0 && <li className="text-xs text-text-muted py-1">No tasks</li>}
            {tasksForDay.map((task) => (
              <li key={task.id} className="w-full">
                <TaskCard task={task} dayStr={dayStr} onStatusChange={onTaskStatusChange} onOpenModal={onTaskClick} refetch={refetch} />
              </li>
            ))}
          </ul>
        </>
      )}

      <button type="button" onClick={() => setGoodHabitsCollapsed((c) => !c)} className="w-full flex items-center justify-between gap-2 py-1.5 text-left font-semibold text-base text-text mt-5">
        <span className="flex items-center gap-2">
          <IconSaint size={20} />
          Good Habits
        </span>
        {goodHabitsCollapsed ? <IconChevronDown size={22} /> : <IconChevronUp size={22} />}
      </button>
      {!goodHabitsCollapsed && (
        <>
          <div className="w-full pt-0.5 pb-0 flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((n) => (
              <span key={n} className={`shrink-0 ${n <= goodHabitsDoneCount ? (n === 5 ? 'text-orange-500' : 'text-amber-500') : 'text-border'}`} title={n === 5 ? '5+ habits' : `Point ${n}`}>
                {n === 5 ? <IconFlameFilled size={16} /> : <IconStar size={14} />}
              </span>
            ))}
          </div>
          <div className="w-full space-y-3 mt-3">
            {goodHabits.length === 0 && <p className="text-xs text-text-muted py-1">No good habits</p>}
            {getHabitsByCategory(goodHabits).map(([categoryLabel, habitsInCategory]) => (
              <div key={categoryLabel || '_good'} className="space-y-0.5">
                {categoryLabel && <p className="text-xs font-medium text-text-muted px-0.5 py-0.5">{categoryLabel}</p>}
                <ul className="space-y-0.5 w-full">
                  {habitsInCategory.map((habit) => (
                    <PlannerHabitRow key={habit.id} habit={habit} dayStr={dayStr} habitTracking={habitTracking} onToggle={onHabitToggle} refetch={refetch} />
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </>
      )}

      <button type="button" onClick={() => setBadHabitsCollapsed((c) => !c)} className="w-full flex items-center justify-between gap-2 py-1.5 text-left font-semibold text-base text-text mt-5">
        <span className="flex items-center gap-2">
          <IconDevil size={20} />
          Bad Habits
        </span>
        {badHabitsCollapsed ? <IconChevronDown size={22} /> : <IconChevronUp size={22} />}
      </button>
      {!badHabitsCollapsed && (
        <>
          <div className="w-full pt-0.5 pb-0 flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((n) => (
              <span key={n} className={`shrink-0 ${n <= badHabitsDoneCount ? (n === 5 ? 'text-orange-500' : 'text-amber-500') : 'text-border'}`} title={n === 5 ? '5+ habits' : `Point ${n}`}>
                {n === 5 ? <IconFlameFilled size={16} /> : <IconStar size={14} />}
              </span>
            ))}
          </div>
          <div className="w-full space-y-3 mt-3">
            {badHabits.length === 0 && <p className="text-xs text-text-muted py-1">No bad habits</p>}
            {getHabitsByCategory(badHabits).map(([categoryLabel, habitsInCategory]) => (
              <div key={categoryLabel || '_bad'} className="space-y-0.5">
                {categoryLabel && <p className="text-xs font-medium text-text-muted px-0.5 py-0.5">{categoryLabel}</p>}
                <ul className="space-y-0.5 w-full">
                  {habitsInCategory.map((habit) => (
                    <PlannerHabitRow key={habit.id} habit={habit} dayStr={dayStr} habitTracking={habitTracking} onToggle={onHabitToggle} refetch={refetch} />
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

function PlannerHabitRow({ habit, dayStr, habitTracking, onToggle, refetch }) {
  const name = str(field(habit, 'Habit Name', 'Habit Name')) || '(untitled)'
  const entry = getHabitEntryForDay(habitTracking, habit.id, dayStr)
  const isDone = entry && isHabitEntrySuccessful(entry)

  const handleToggle = async (e) => {
    e.stopPropagation()
    try {
      await onToggle(habit.id, dayStr, isDone, entry?.id)
      refetch()
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
  const { fetchApi } = useApi()
  const { data, loading, error, refetch } = usePlannerData()
  const { tasks, habits, habitTracking } = data
  const todayStr = new Date().toISOString().slice(0, 10)
  const [weekOffset, setWeekOffset] = useState(0)
  const [mobileDateStr, setMobileDateStr] = useState(todayStr)
  const [touchStartX, setTouchStartX] = useState(null)
  const [modalTask, setModalTask] = useState(null)
  const [createTaskOpen, setCreateTaskOpen] = useState(false)
  const [desktopTasksCollapsed, setDesktopTasksCollapsed] = useState(false)
  const [desktopGoodHabitsCollapsed, setDesktopGoodHabitsCollapsed] = useState(false)
  const [desktopBadHabitsCollapsed, setDesktopBadHabitsCollapsed] = useState(false)
  const [desktopShowCompleted, setDesktopShowCompleted] = useState(false)

  const weekDays = getWeekDaysForOffset(weekOffset)
  const mobileWeekDays = getWeekDays(mobileDateStr)
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
      await fetchApi(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        body: JSON.stringify(fields),
      })
      refetch()
    },
    [fetchApi, refetch]
  )

  const handleCreateTask = useCallback(
    async (fields) => {
      await fetchApi('/api/tasks', {
        method: 'POST',
        body: JSON.stringify(fields),
      })
      refetch()
    },
    [fetchApi, refetch]
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

  const goodHabits = filterHabitsByType(habits, 'Good')
  const badHabits = filterHabitsByType(habits, 'Bad')

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
      refetch={refetch}
      hideDayHeader
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
      refetch={refetch}
      hideDayHeader
    />
  ))

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={[{ label: 'Home', to: '/' }, { label: 'Planner' }]}
        onRefresh={refetch}
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
                <Switch checked={desktopShowCompleted} onChange={setDesktopShowCompleted} label="Show completed" />
              )}
              {desktopTasksCollapsed ? <IconChevronDown size={22} /> : <IconChevronUp size={22} />}
            </span>
          </button>
          {!desktopTasksCollapsed && (
            <div className="grid grid-cols-7 gap-3 mt-2 min-h-[120px]">
              {weekDays.map((dayStr) => (
                <DayTasksColumn
                  key={dayStr}
                  dayStr={dayStr}
                  tasks={tasks}
                  showCompleted={desktopShowCompleted}
                  onTaskStatusChange={handleTaskStatusChange}
                  onTaskClick={setModalTask}
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
              onClick={() => setDesktopGoodHabitsCollapsed((c) => !c)}
              className="w-full flex items-center justify-between gap-2 py-2 text-left font-semibold text-base text-text"
            >
              <span className="flex items-center gap-2">
                <IconSaint size={22} />
                Good Habits
              </span>
              {desktopGoodHabitsCollapsed ? <IconChevronDown size={22} /> : <IconChevronUp size={22} />}
            </button>
            {!desktopGoodHabitsCollapsed && (
              <div className="grid grid-cols-7 gap-3 mt-2 min-h-[80px]">
                {weekDays.map((dayStr) => (
                  <DayHabitsColumn
                    key={dayStr}
                    dayStr={dayStr}
                    habits={goodHabits}
                    habitTracking={habitTracking}
                    onHabitToggle={handleHabitToggle}
                    refetch={refetch}
                  />
                ))}
              </div>
            )}
          </div>
          <div>
            <button
              type="button"
              onClick={() => setDesktopBadHabitsCollapsed((c) => !c)}
              className="w-full flex items-center justify-between gap-2 py-2 text-left font-semibold text-base text-text"
            >
              <span className="flex items-center gap-2">
                <IconDevil size={22} />
                Bad Habits
              </span>
              {desktopBadHabitsCollapsed ? <IconChevronDown size={22} /> : <IconChevronUp size={22} />}
            </button>
            {!desktopBadHabitsCollapsed && (
              <div className="grid grid-cols-7 gap-3 mt-2 min-h-[80px]">
                {weekDays.map((dayStr) => (
                  <DayHabitsColumn
                    key={dayStr}
                    dayStr={dayStr}
                    habits={badHabits}
                    habitTracking={habitTracking}
                    onHabitToggle={handleHabitToggle}
                    refetch={refetch}
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
            className="min-h-[44px] min-w-[44px] rounded-xl border-2 border-border bg-surface text-text"
          >
            ←
          </button>
          <span className="font-semibold text-text">
            {DAY_NAMES[mobileDayIndex]} {formatDayDate(mobileDateStr)}
          </span>
          <button
            type="button"
            aria-label="Next day"
            onClick={() => setMobileDateStr((d) => addDays(d, 1))}
            className="min-h-[44px] min-w-[44px] rounded-xl border-2 border-border bg-surface text-text"
          >
            →
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
