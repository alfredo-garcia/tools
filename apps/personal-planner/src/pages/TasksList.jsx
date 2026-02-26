import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useApi, Spinner, PageHeader, Card, CardList, IconCheckSquare } from '@tools/shared'
import { field, str, dateStr } from '../lib/normalize'
import { getTaskDisplayGroup } from '../lib/taskStatus'
import { isToday, isThisWeek, isThisMonth, isPastDue } from '../lib/dateFilters'

const FILTER_OPTIONS = [
  { value: 'today', label: 'Hoy' },
  { value: 'week', label: 'Semana' },
  { value: 'month', label: 'Mes' },
  { value: 'all', label: 'Todas' },
]

const GROUP_ORDER = ['past_due', 'in_progress', 'pending', 'done']
const GROUP_LABELS = {
  past_due: 'Past due',
  in_progress: 'In progress',
  pending: 'Pending',
  done: 'Done',
}

function filterByDate(list, filter, getDue) {
  if (filter === 'all') return list
  return list.filter((t) => {
    const due = getDue(t)
    if (filter === 'today') return isToday(due)
    if (filter === 'week') return isThisWeek(due)
    if (filter === 'month') return isThisMonth(due)
    return true
  })
}

function TaskCard({ task, getDue }) {
  const name = str(field(task, 'Task Name', 'Task Name')) || '(sin nombre)'
  const category = str(field(task, 'Category', 'Category'))
  const status = str(field(task, 'Status', 'Status'))
  const due = getDue(task)
  const assignee = field(task, 'Assignee', 'Assignee')
  const statusGroup = getTaskDisplayGroup(task, due, isPastDue)
  const isDone = statusGroup === 'done'

  return (
    <Link to={`/tasks/${task.id}`} className="block">
      <Card
        title={name}
        icon={<IconCheckSquare size={20} />}
        className={isDone ? 'opacity-90' : ''}
      >
        <div className="flex flex-wrap gap-x-3 gap-y-0.5">
          {category && <span>{category}</span>}
          {status && <span>{status}</span>}
          <span>Vence: {due || '—'}</span>
          {assignee != null && assignee !== '' && (
            <span>Asignado: {str(assignee)}</span>
          )}
        </div>
        {isDone && (
          <span className="inline-block mt-1 text-xs text-green-600 dark:text-green-400">Completada</span>
        )}
      </Card>
    </Link>
  )
}

export function TasksList() {
  const { fetchApi } = useApi()
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('today')

  const refetch = useCallback(() => {
    setLoading(true)
    setError(null)
    fetchApi('/api/tasks')
      .then((r) => setList(r.data || []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [fetchApi])

  useEffect(() => {
    refetch()
  }, [refetch])

  const getDue = (t) => dateStr(field(t, 'Due Date', 'Due Date'))
  const filtered = filterByDate(list, filter, getDue)

  const groupBy = (t) => getTaskDisplayGroup(t, getDue(t), isPastDue)
  const initialCollapsed = { past_due: false, in_progress: false, pending: false, done: true }

  const groups = GROUP_ORDER.reduce((acc, key) => {
    acc[key] = filtered.filter((t) => groupBy(t) === key)
    return acc
  }, {})
  const doneCount = groups.done.length
  const inProgressCount = groups.in_progress.length
  const pendingCount = groups.pending.length
  const pastDueCount = groups.past_due.length
  const total = filtered.length
  const completionPct = total === 0 ? 0 : Math.round((doneCount / total) * 100)

  const renderItem = (task) => <TaskCard key={task.id} task={task} getDue={getDue} />

  if (loading && list.length === 0) return <div className="flex justify-center py-12"><Spinner size="lg" /></div>
  if (error && list.length === 0) return <p className="text-red-600 dark:text-red-400">{error}</p>

  return (
    <div className="space-y-6">
      <PageHeader breadcrumbs={[{ label: 'Home', to: '/' }, { label: 'Tareas', to: '/tasks' }]} onRefresh={refetch} loading={loading} />
      <div className="flex flex-wrap gap-2">
        {FILTER_OPTIONS.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            onClick={() => setFilter(value)}
            className={`min-h-[44px] px-4 py-2 rounded-xl text-base font-medium ${
              filter === value
                ? 'bg-primary text-white'
                : 'bg-surface border-2 border-border text-text'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <section className="rounded-2xl bg-surface p-4">
        <h2 className="text-sm font-medium text-text-muted mb-3">KPIs</h2>
        <div className="flex flex-wrap gap-4 items-baseline">
          <span className="text-2xl font-bold text-text">{completionPct}% completado</span>
          <span className="text-text-muted">Past due: <strong className="text-text">{pastDueCount}</strong></span>
          <span className="text-text-muted">In progress: <strong className="text-text">{inProgressCount}</strong></span>
          <span className="text-text-muted">Pending: <strong className="text-text">{pendingCount}</strong></span>
          <span className="text-text-muted">Done: <strong className="text-text">{doneCount}</strong></span>
        </div>
      </section>

      <CardList
        items={filtered}
        groupBy={groupBy}
        groupOrder={GROUP_ORDER}
        groupLabels={GROUP_LABELS}
        renderItem={renderItem}
        initialCollapsed={initialCollapsed}
      />

      {filtered.length === 0 && (
        <p className="text-text-muted">No hay tareas con este filtro.</p>
      )}
    </div>
  )
}
