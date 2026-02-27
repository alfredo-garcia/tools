import { useState, useEffect, useCallback } from 'react'
import { useApi, Spinner, PageHeader, IconChevronDown, IconChevronUp, IconStar, IconFlameFilled } from '@tools/shared'
import { field, str, dateStr, arr, getWeekDays, getWeekdayIndex } from '@tools/shared'
import { getTaskStatusGroup } from '../lib/taskStatus'
import { TaskCard, STATUS_OPTIONS } from '../components/TaskCard'

const DAY_NAMES = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
const MONTH_NAMES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
const MIN_HABITS_FOR_FIRE = 5

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

/** Agrupa hábitos por categoría. Clave '' para sin categoría. Orden: categorías con nombre primero (alfabético), sin categoría al final. */
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
    ? 'Sin tareas'
    : `Hecho: ${donePct}%, En progreso: ${inProgressPct}%, Pendiente: ${pendingPct}%`
  const habitsDoneCount = habits.filter((h) => {
    const entry = getHabitEntryForDay(habitTracking, h.id, dayStr)
    return entry && isHabitEntrySuccessful(entry)
  }).length
  const { hasStar, hasFire } = dayHeaderStars(tasksForDay, habits, habitTracking, dayStr)
  const dayLabel = DAY_NAMES[dayIndex]

  return (
    <div className="flex flex-col min-w-0 overflow-y-auto overflow-x-hidden px-2">
      {/* Day header - solo un elemento, sin contenedor visual */}
      <div className="py-2 shrink-0 flex items-center justify-between gap-2">
        <div>
          <div className="font-bold text-text">{dayLabel}</div>
          <div className="text-sm text-text-muted">{formatDayDate(dayStr)}</div>
        </div>
        <div className="flex items-center gap-0.5 shrink-0">
          {hasStar && (
            <span className="text-amber-500" title={hasFire ? 'Tareas completadas + 5+ hábitos' : 'Todas las tareas completadas'}>
              <IconStar size={18} />
            </span>
          )}
          {hasFire && (
            <span className="text-orange-500" title="5+ hábitos buenos">
              <IconFlameFilled size={22} />
            </span>
          )}
        </div>
      </div>

      {/* Tasks - cabecera sin borde ni fondo, ancho total */}
      <button
        type="button"
        onClick={() => setTasksCollapsed((c) => !c)}
        className="w-full flex items-center justify-between gap-2 py-1.5 text-left font-semibold text-base text-text"
      >
        <span>Tasks ({tasksForDay.length})</span>
        {tasksCollapsed ? <IconChevronDown size={22} /> : <IconChevronUp size={22} />}
      </button>
      {!tasksCollapsed && (
        <>
          <div className="w-full flex items-center gap-2 pt-0.5 pb-0">
            <div
              className="flex-1 h-2 rounded-full overflow-hidden flex"
              role="progressbar"
              aria-valuenow={donePct}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={progressBarTitle}
              title={progressBarTitle}
            >
              {donePct > 0 && (
                <div className="h-full bg-green-500 transition-all shrink-0" style={{ width: `${donePct}%` }} />
              )}
              {inProgressPct > 0 && (
                <div className="h-full bg-blue-500 transition-all shrink-0" style={{ width: `${inProgressPct}%` }} />
              )}
              {pendingPct > 0 && (
                <div className="h-full bg-gray-500 transition-all shrink-0" style={{ width: `${pendingPct}%` }} />
              )}
            </div>
            <span className="text-xs font-medium text-text-muted shrink-0" title={progressBarTitle}>{donePct}%</span>
          </div>
          <ul className="space-y-2 w-full mt-3">
            {tasksForDay.length === 0 && (
              <li className="text-xs text-text-muted py-1">Ninguna tarea</li>
            )}
            {tasksForDay.map((task) => (
              <li key={task.id} className="w-full">
                <TaskCard
                  task={task}
                  dayStr={dayStr}
                  onStatusChange={onTaskStatusChange}
                  onOpenModal={onTaskClick}
                  refetch={refetch}
                />
              </li>
            ))}
          </ul>
        </>
      )}

      {/* Habits - cabecera sin borde ni fondo, ancho total */}
      <button
        type="button"
        onClick={() => setHabitsCollapsed((c) => !c)}
        className="w-full flex items-center justify-between gap-2 py-1.5 text-left font-semibold text-base text-text mt-5"
      >
        <span>Habits</span>
        {habitsCollapsed ? <IconChevronDown size={22} /> : <IconChevronUp size={22} />}
      </button>
      {!habitsCollapsed && (
        <>
          <div className="w-full pt-0.5 pb-0 flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((n) => (
              <span
                key={n}
                className={`shrink-0 ${n <= habitsDoneCount ? (n === 5 ? 'text-orange-500' : 'text-amber-500') : 'text-border'}`}
                title={n === 5 ? '5+ hábitos' : `Punto ${n}`}
              >
                {n === 5 ? <IconFlameFilled size={16} /> : <IconStar size={14} />}
              </span>
            ))}
          </div>
          <div className="w-full space-y-3 mt-3">
            {habits.length === 0 && (
              <p className="text-xs text-text-muted py-1">Ningún hábito</p>
            )}
            {getHabitsByCategory(habits).map(([categoryLabel, habitsInCategory]) => (
              <div key={categoryLabel || '_sin_categoria'} className="space-y-0.5">
                {categoryLabel && (
                  <p className="text-xs font-medium text-text-muted px-0.5 py-0.5">{categoryLabel}</p>
                )}
                <ul className="space-y-0.5 w-full">
                  {habitsInCategory.map((habit) => (
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
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function PlannerHabitRow({ habit, dayStr, habitTracking, onToggle, refetch }) {
  const name = str(field(habit, 'Habit Name', 'Habit Name')) || '(sin nombre)'
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

function TaskModal({ task, onClose, onStatusChange, refetch }) {
  if (!task) return null
  const name = str(field(task, 'Task Name', 'Task Name')) || '(sin nombre)'
  const statusGroup = getTaskStatusGroup(task)
  const rows = [
    ['Descripción', str(field(task, 'Description', 'Description'))],
    ['Asignado', str(field(task, 'Assignee', 'Assignee'))],
    ['Clasificación', str(field(task, 'Category', 'Category'))],
    ['Prioridad', str(field(task, 'Priority', 'Priority'))],
    ['Estado', str(field(task, 'Status', 'Status'))],
    ['Fecha límite', dateStr(field(task, 'Due Date', 'Due Date'))],
  ]

  const handleStatus = async (newStatus) => {
    try {
      await onStatusChange(task.id, newStatus)
      refetch()
    } catch (err) {
      console.error(err)
    }
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
        className="bg-surface rounded-2xl border-2 border-border shadow-xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-border flex items-center justify-between gap-2">
          <h2 id="task-modal-title" className="font-bold text-lg text-text truncate">
            {name}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 p-2 rounded-lg text-text-muted hover:bg-border"
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>
        <div className="p-4 overflow-y-auto flex-1">
          <dl className="grid gap-2">
            {rows.map(([label, value]) =>
              value ? (
                <div key={label}>
                  <dt className="text-xs text-text-muted">{label}</dt>
                  <dd className="text-sm text-text">{value}</dd>
                </div>
              ) : null
            )}
          </dl>
          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-xs text-text-muted mb-2">Cambiar estado</p>
            <div className="flex flex-wrap gap-2">
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
                    className={`min-h-[44px] px-4 rounded-xl text-sm font-medium ${
                      isActive ? 'bg-primary text-white' : 'bg-border text-text hover:bg-border/80'
                    }`}
                  >
                    {label}
                  </button>
                )
              })}
            </div>
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
  const weekDays = getWeekDays()
  const todayStr = new Date().toISOString().slice(0, 10)
  const defaultDayIndex = getWeekdayIndex(todayStr)
  const [mobileDayIndex, setMobileDayIndex] = useState(defaultDayIndex >= 0 ? defaultDayIndex : 0)
  const [touchStartX, setTouchStartX] = useState(null)
  const [modalTask, setModalTask] = useState(null)

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
      onTaskClick={setModalTask}
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

      <div className="hidden md:grid md:grid-cols-7 gap-3 overflow-x-auto">
        {dayColumns}
      </div>

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
            {DAY_NAMES[mobileDayIndex]} {formatDayDate(weekDays[mobileDayIndex])}
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

      {modalTask && (
        <TaskModal
          task={modalTask}
          onClose={() => setModalTask(null)}
          onStatusChange={handleTaskStatusChange}
          refetch={refetch}
        />
      )}
    </div>
  )
}
