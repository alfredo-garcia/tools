import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useApi, Spinner, PageHeader, Card, CardList, IconCheckSquare } from '@tools/shared'
import { field, str, dateStr, isToday, isThisWeek, isThisMonth, isPastDue } from '@tools/shared'
import { getTaskStatusGroup } from '../lib/taskStatus'

const FILTER_OPTIONS = [
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
  { value: 'all', label: 'All' },
]

const GROUP_ORDER = ['in_progress', 'pending', 'done']
const GROUP_LABELS = {
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
  const name = str(field(task, 'Task Name', 'Task Name')) || '(untitled)'
  const category = str(field(task, 'Category', 'Category'))
  const status = str(field(task, 'Status', 'Status'))
  const due = getDue(task)
  const assignee = field(task, 'Assignee', 'Assignee')
  const statusGroup = getTaskStatusGroup(task)
  const isDone = statusGroup === 'done'
  const showPastDueTag = !isDone && due && isPastDue(due)

  return (
    <Link to={`/tasks/${task.id}`} className="block">
      <Card
        title={name}
        icon={<IconCheckSquare size={20} />}
        className={isDone ? 'opacity-90' : ''}
      >
        <div className="flex flex-wrap items-center gap-2">
          {showPastDueTag && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-500/20 text-red-600 dark:text-red-400">
              Past due: {due}
            </span>
          )}
          <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-sm text-text-muted">
            {category && <span>{category}</span>}
            {status && <span>{status}</span>}
            <span>Due: {due || '—'}</span>
            {assignee != null && assignee !== '' && (
              <span>Assignee: {str(assignee)}</span>
            )}
          </div>
        </div>
        {isDone && (
          <span className="inline-block mt-1 text-xs text-green-600 dark:text-green-400">Completed</span>
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
  const filteredByDate = filterByDate(list, filter, getDue)
  const pastDueFromFull = list.filter((t) => {
    const due = getDue(t)
    return due && isPastDue(due) && getTaskStatusGroup(t) !== 'done'
  })
  const filteredIds = new Set(filteredByDate.map((t) => t.id))
  const filtered = [...filteredByDate]
  pastDueFromFull.forEach((t) => {
    if (!filteredIds.has(t.id)) {
      filtered.push(t)
      filteredIds.add(t.id)
    }
  })

  const groupBy = getTaskStatusGroup
  const initialCollapsed = { in_progress: false, pending: false, done: true }

  const groups = GROUP_ORDER.reduce((acc, key) => {
    acc[key] = filtered.filter((t) => groupBy(t) === key)
    return acc
  }, {})
  const doneCount = groups.done.length
  const inProgressCount = groups.in_progress.length
  const pendingCount = groups.pending.length
  const pastDueCount = pastDueFromFull.length
  const total = filtered.length
  const completionPct = total === 0 ? 0 : Math.round((doneCount / total) * 100)

  const renderItem = (task) => <TaskCard key={task.id} task={task} getDue={getDue} />

  if (loading && list.length === 0) return <div className="flex justify-center py-12"><Spinner size="lg" /></div>
  if (error && list.length === 0) return <p className="text-red-600 dark:text-red-400">{error}</p>

  return (
    <div className="space-y-6">
      <PageHeader breadcrumbs={[{ label: 'Home', to: '/' }, { label: 'Tasks', to: '/tasks' }]} onRefresh={refetch} loading={loading} />
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
          <span className="text-2xl font-bold text-text">{completionPct}% completed</span>
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
        <p className="text-text-muted">No tasks for this filter.</p>
      )}
    </div>
  )
}
