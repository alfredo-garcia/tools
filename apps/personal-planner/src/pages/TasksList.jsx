import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useApi, Spinner, PageHeader } from '@tools/shared'
import { field, str, dateStr } from '../lib/normalize'
import { getTaskStatusGroup } from '../lib/taskStatus'
import { isToday, isThisWeek, isThisMonth } from '../lib/dateFilters'

const FILTER_OPTIONS = [
  { value: 'today', label: 'Hoy' },
  { value: 'week', label: 'Semana' },
  { value: 'month', label: 'Mes' },
  { value: 'all', label: 'Todas' },
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

function groupByStatus(tasks) {
  const groups = { in_progress: [], pending: [], done: [] }
  tasks.forEach((t) => {
    const g = getTaskStatusGroup(t)
    if (groups[g]) groups[g].push(t)
  })
  return groups
}

export function TasksList() {
  const { fetchApi } = useApi()
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('today')
  const [collapsedGroups, setCollapsedGroups] = useState({
    in_progress: false,
    pending: false,
    done: true,
  })

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
  const groups = groupByStatus(filtered)

  const total = filtered.length
  const doneCount = groups.done.length
  const inProgressCount = groups.in_progress.length
  const pendingCount = groups.pending.length
  const completionPct = total === 0 ? 0 : Math.round((doneCount / total) * 100)

  const toggleGroup = (key) => {
    setCollapsedGroups((prev) => ({ ...prev, [key]: !prev[key] }))
  }

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

      <section className="rounded-2xl border-2 border-border bg-surface p-4">
        <h2 className="text-sm font-medium text-text-muted mb-3">KPIs</h2>
        <div className="flex flex-wrap gap-4 items-baseline">
          <span className="text-2xl font-bold text-text">{completionPct}% completado</span>
          <span className="text-text-muted">Done: <strong className="text-text">{doneCount}</strong></span>
          <span className="text-text-muted">In progress: <strong className="text-text">{inProgressCount}</strong></span>
          <span className="text-text-muted">Pending: <strong className="text-text">{pendingCount}</strong></span>
        </div>
      </section>

      <div className="space-y-4">
        {GROUP_ORDER.map((groupKey) => {
          const tasks = groups[groupKey]
          const collapsed = collapsedGroups[groupKey]
          const label = GROUP_LABELS[groupKey]
          return (
            <div key={groupKey} className="rounded-xl border-2 border-border bg-surface overflow-hidden">
              <button
                type="button"
                onClick={() => toggleGroup(groupKey)}
                className="w-full flex items-center justify-between gap-2 px-4 py-3 text-left font-medium text-text hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              >
                <span>{label}</span>
                <span className="text-text-muted font-normal">{tasks.length}</span>
                <span className="text-text-muted text-lg leading-none" aria-hidden>
                  {collapsed ? '▶' : '▼'}
                </span>
              </button>
              {!collapsed && (
                <ul className="border-t border-border divide-y divide-border">
                  {tasks.map((t) => {
                    const isDone = groupKey === 'done'
                    return (
                      <li key={t.id}>
                        <Link
                          to={`/tasks/${t.id}`}
                          className={`block px-4 py-3 hover:bg-black/5 dark:hover:bg-white/5 transition-colors ${
                            isDone
                              ? 'border-l-4 border-green-500/50 opacity-90'
                              : 'border-l-4 border-transparent'
                          }`}
                        >
                          <span className={`font-medium ${isDone ? 'line-through text-text-muted' : 'text-text'}`}>
                            {str(field(t, 'Task Name', 'Task Name')) || '(sin nombre)'}
                          </span>
                          <div className="flex flex-wrap gap-2 mt-1 text-sm text-text-muted">
                            <span>{str(field(t, 'Category', 'Category'))}</span>
                            <span>{str(field(t, 'Status', 'Status'))}</span>
                            <span>Vence: {getDue(t) || '—'}</span>
                            {field(t, 'Assignee', 'Assignee') && (
                              <span>Asignado: {str(field(t, 'Assignee', 'Assignee'))}</span>
                            )}
                          </div>
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <p className="text-text-muted">No hay tareas con este filtro.</p>
      )}
    </div>
  )
}
