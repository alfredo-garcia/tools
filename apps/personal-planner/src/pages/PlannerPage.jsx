import { useState, useEffect, useCallback } from 'react'
import { useApi, Spinner, PageHeader, IconChevronDown, IconChevronUp, IconChevronLeft, IconChevronRight, IconStar, IconFlameFilled, IconTarget, IconCalendar, IconUser, IconTag, IconCircle, IconPlay, IconCheckSquare } from '@tools/shared'
import { field, str, dateStr, arr, getWeekDays, getWeekStart, getWeekdayIndex } from '@tools/shared'
import { getTaskStatusGroup } from '../lib/taskStatus'
import { TaskCard, STATUS_OPTIONS, getPriorityTagClass } from '../components/TaskCard'

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

/** Columna de tasks de un día (header + barra + lista). Sin collapse. */
function DayTasksColumn({ dayStr, tasks, onTaskStatusChange, onTaskClick, refetch }) {
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
        {tasksForDay.length === 0 && <li className="text-xs text-text-muted py-1">No tasks</li>}
        {tasksForDay.map((task) => (
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
  habitTracking,
  onTaskStatusChange,
  onHabitToggle,
  onTaskClick,
  refetch,
  hideDayHeader = false,
}) {
  const [tasksCollapsed, setTasksCollapsed] = useState(false)
  const [habitsCollapsed, setHabitsCollapsed] = useState(false)

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

      <button type="button" onClick={() => setHabitsCollapsed((c) => !c)} className="w-full flex items-center justify-between gap-2 py-1.5 text-left font-semibold text-base text-text mt-5">
        <span>Habits</span>
        {habitsCollapsed ? <IconChevronDown size={22} /> : <IconChevronUp size={22} />}
      </button>
      {!habitsCollapsed && (
        <>
          <div className="w-full pt-0.5 pb-0 flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((n) => (
              <span key={n} className={`shrink-0 ${n <= habitsDoneCount ? (n === 5 ? 'text-orange-500' : 'text-amber-500') : 'text-border'}`} title={n === 5 ? '5+ habits' : `Point ${n}`}>
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
        <span className={`text-sm text-text truncate ${isDone ? 'font-normal line-through opacity-80' : ''}`}>{name}</span>
      </button>
    </li>
  )
}

const PRIORITY_OPTIONS = ['Low', 'Medium', 'High']

function TaskModal({ task, onClose, onStatusChange, onTaskUpdate, refetch }) {
  const [editingField, setEditingField] = useState(null)
  const [editValue, setEditValue] = useState('')

  if (!task) return null
  const name = str(field(task, 'Task Name', 'Task Name')) || ''
  const statusGroup = getTaskStatusGroup(task)
  const description = str(field(task, 'Description', 'Description')) || ''
  const priority = str(field(task, 'Priority', 'Priority')) || ''
  const dueStr = dateStr(field(task, 'Due Date', 'Due Date')) || ''
  const assignee = str(field(task, 'Assignee', 'Assignee')) || ''
  const category = str(field(task, 'Category', 'Category')) || ''

  const handleStatus = async (e, newStatus) => {
    e?.stopPropagation?.()
    try {
      await onStatusChange(task.id, newStatus)
      refetch()
    } catch (err) {
      console.error(err)
    }
  }

  const startEdit = (field, currentValue) => {
    setEditingField(field)
    setEditValue(currentValue ?? '')
  }

  const saveEdit = async (field, payload) => {
    try {
      await onTaskUpdate(task.id, payload)
      setEditingField(null)
    } catch (err) {
      console.error(err)
    }
  }

  const handleBlurName = () => {
    if (editingField !== 'name') return
    const v = editValue.trim()
    saveEdit('name', { 'Task Name': v || name || '(untitled)' })
  }
  const handleBlurDescription = () => {
    if (editingField !== 'description') return
    saveEdit('description', { Description: editValue })
  }
  const handleBlurAssignee = () => {
    if (editingField !== 'assignee') return
    saveEdit('assignee', { Assignee: editValue.trim() })
  }
  const handleBlurCategory = () => {
    if (editingField !== 'category') return
    saveEdit('category', { Category: editValue.trim() })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="task-modal-title"
    >
      <div
        className="bg-surface rounded-2xl border-2 border-border shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b border-border flex items-center justify-between gap-3">
          {editingField === 'name' ? (
            <input
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={handleBlurName}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleBlurName() } }}
              className="flex-1 min-w-0 font-bold text-xl text-text bg-surface border border-border rounded-lg px-2 py-1"
              id="task-modal-title"
              autoFocus
            />
          ) : (
            <h2
              id="task-modal-title"
              role="button"
              tabIndex={0}
              onClick={() => startEdit('name', name)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); startEdit('name', name) } }}
              className="font-bold text-xl text-text truncate flex-1 min-w-0 cursor-pointer rounded hover:bg-border/50 py-1 -mx-1 px-1"
            >
              {name || '(untitled)'}
            </h2>
          )}
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 p-2 rounded-lg text-text-muted hover:bg-border text-xl leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {editingField === 'description' ? (
            <textarea
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={handleBlurDescription}
              className="w-full text-sm font-normal text-text bg-surface border border-border rounded-lg px-3 py-2 min-h-[80px] resize-y"
              placeholder="Description"
              autoFocus
            />
          ) : (
            <p
              role="button"
              tabIndex={0}
              onClick={() => startEdit('description', description)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); startEdit('description', description) } }}
              className="text-sm font-normal text-text whitespace-pre-wrap cursor-pointer rounded hover:bg-border/50 py-2 -mx-2 px-2 min-h-[2rem]"
            >
              {description || '(no description)'}
            </p>
          )}
          <hr className="border-border" />
          <div className="space-y-2">
            {/* Priority */}
            <div className="flex items-center gap-2 text-sm">
              <span className="text-text-muted shrink-0"><IconTarget size={18} /></span>
              <span className="text-text-muted shrink-0">Priority:</span>
              {editingField === 'priority' ? (
                <select
                  value={editValue}
                  onChange={(e) => { const v = e.target.value; saveEdit('priority', { Priority: v }); setEditValue(v) }}
                  onBlur={() => setEditingField(null)}
                  className="rounded border border-border bg-surface text-text px-2 py-1 text-sm"
                  autoFocus
                >
                  <option value="">—</option>
                  {PRIORITY_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              ) : (
                <span
                  role="button"
                  tabIndex={0}
                  onClick={() => startEdit('priority', priority)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); startEdit('priority', priority) } }}
                  className={`inline-flex px-1.5 py-0.5 rounded text-xs font-medium cursor-pointer ${getPriorityTagClass(priority)} hover:ring-2 ring-offset-2 ring-border`}
                >
                  {priority || '—'}
                </span>
              )}
            </div>
            {/* Due date */}
            <div className="flex items-center gap-2 text-sm">
              <span className="text-text-muted shrink-0"><IconCalendar size={18} /></span>
              <span className="text-text-muted shrink-0">Due date:</span>
              {editingField === 'dueDate' ? (
                <input
                  type="date"
                  value={editValue}
                  onChange={(e) => { const v = e.target.value; saveEdit('dueDate', { 'Due Date': v || null }); setEditingField(null) }}
                  onBlur={() => setEditingField(null)}
                  className="rounded border border-border bg-surface text-text px-2 py-1 text-sm"
                  autoFocus
                />
              ) : (
                <span
                  role="button"
                  tabIndex={0}
                  onClick={() => startEdit('dueDate', dueStr)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); startEdit('dueDate', dueStr) } }}
                  className="text-text cursor-pointer rounded hover:bg-border/50 py-0.5 px-1"
                >
                  {dueStr || '—'}
                </span>
              )}
            </div>
            {/* Assignee */}
            <div className="flex items-center gap-2 text-sm">
              <span className="text-text-muted shrink-0"><IconUser size={18} /></span>
              <span className="text-text-muted shrink-0">Assignee:</span>
              {editingField === 'assignee' ? (
                <input
                  type="text"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onBlur={handleBlurAssignee}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleBlurAssignee() } }}
                  className="flex-1 min-w-0 rounded border border-border bg-surface text-text px-2 py-1 text-sm"
                  placeholder="Name"
                  autoFocus
                />
              ) : (
                <span
                  role="button"
                  tabIndex={0}
                  onClick={() => startEdit('assignee', assignee)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); startEdit('assignee', assignee) } }}
                  className="text-text cursor-pointer rounded hover:bg-border/50 py-0.5 px-1"
                >
                  {assignee || '—'}
                </span>
              )}
            </div>
            {/* Category */}
            <div className="flex items-center gap-2 text-sm">
              <span className="text-text-muted shrink-0"><IconTag size={18} /></span>
              <span className="text-text-muted shrink-0">Category:</span>
              {editingField === 'category' ? (
                <input
                  type="text"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onBlur={handleBlurCategory}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleBlurCategory() } }}
                  className="flex-1 min-w-0 rounded border border-border bg-surface text-text px-2 py-1 text-sm"
                  placeholder="Category"
                  autoFocus
                />
              ) : (
                <span
                  role="button"
                  tabIndex={0}
                  onClick={() => startEdit('category', category)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); startEdit('category', category) } }}
                  className="text-text cursor-pointer rounded hover:bg-border/50 py-0.5 px-1"
                >
                  {category || '—'}
                </span>
              )}
            </div>
          </div>
          <hr className="border-border" />
          <div className="flex flex-wrap gap-2">
            {STATUS_OPTIONS.map(({ value, label }) => {
              const isActive =
                (value === 'Done' && statusGroup === 'done') ||
                (value === 'In Progress' && statusGroup === 'in_progress') ||
                (value === 'Pending' && statusGroup === 'pending')
              const isPending = value === 'Pending'
              const isInProgress = value === 'In Progress'
              const btnClass = isActive
                ? isPending
                  ? 'bg-status-pending text-white'
                  : isInProgress
                    ? 'bg-status-in-progress text-white'
                    : 'bg-status-done text-white'
                : 'bg-border text-text hover:bg-border/80'
              const Icon = isPending ? IconCircle : isInProgress ? IconPlay : IconCheckSquare
              return (
                <button
                  key={value}
                  type="button"
                  onClick={(e) => handleStatus(e, value)}
                  className={`min-h-[44px] px-4 rounded-xl text-sm font-medium flex items-center gap-2 cursor-pointer ${btnClass}`}
                >
                  <Icon size={18} />
                  {label}
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
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
  const [desktopTasksCollapsed, setDesktopTasksCollapsed] = useState(false)
  const [desktopHabitsCollapsed, setDesktopHabitsCollapsed] = useState(false)

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
            className="w-full flex items-center justify-between gap-2 py-2 text-left font-semibold text-base text-text"
          >
            <span>Tasks</span>
            {desktopTasksCollapsed ? <IconChevronDown size={22} /> : <IconChevronUp size={22} />}
          </button>
          {!desktopTasksCollapsed && (
            <div className="grid grid-cols-7 gap-3 mt-2 min-h-[120px]">
              {weekDays.map((dayStr) => (
                <DayTasksColumn
                  key={dayStr}
                  dayStr={dayStr}
                  tasks={tasks}
                  onTaskStatusChange={handleTaskStatusChange}
                  onTaskClick={setModalTask}
                  refetch={refetch}
                />
              ))}
            </div>
          )}
        </div>
        <div className="mt-6 pt-4 border-t border-border">
          <button
            type="button"
            onClick={() => setDesktopHabitsCollapsed((c) => !c)}
            className="w-full flex items-center justify-between gap-2 py-2 text-left font-semibold text-base text-text"
          >
            <span>Habits</span>
            {desktopHabitsCollapsed ? <IconChevronDown size={22} /> : <IconChevronUp size={22} />}
          </button>
          {!desktopHabitsCollapsed && (
            <div className="grid grid-cols-7 gap-3 mt-2 min-h-[80px]">
              {weekDays.map((dayStr) => (
                <DayHabitsColumn
                  key={dayStr}
                  dayStr={dayStr}
                  habits={habits}
                  habitTracking={habitTracking}
                  onHabitToggle={handleHabitToggle}
                  refetch={refetch}
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
          refetch={refetch}
        />
      )}
    </div>
  )
}
