import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useApi, Spinner, PageHeader } from '@tools/shared'
import { field, str, dateStr } from '../lib/normalize'

const STATUS_DONE = ['Done', 'Complete', 'Completado', 'Hecho', 'Cerrado']

export function TasksList() {
  const { fetchApi } = useApi()
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('all') // all | week | done

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

  const isThisWeek = (d) => {
    if (!d) return false
    const x = new Date(d)
    const now = new Date()
    const start = new Date(now)
    start.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1))
    start.setHours(0, 0, 0, 0)
    const end = new Date(start)
    end.setDate(end.getDate() + 6)
    end.setHours(23, 59, 59, 999)
    return x >= start && x <= end
  }

  const filtered =
    filter === 'week'
      ? list.filter((t) => isThisWeek(dateStr(field(t, 'Due Date', 'Due Date'))))
      : filter === 'done'
        ? list.filter((t) => STATUS_DONE.includes(str(field(t, 'Status', 'Status'))))
        : list

  if (loading && list.length === 0) return <div className="flex justify-center py-12"><Spinner size="lg" /></div>
  if (error && list.length === 0) return <p className="text-red-600 dark:text-red-400">{error}</p>

  return (
    <div className="space-y-6">
      <PageHeader breadcrumbs={[{ label: 'Home', to: '/' }, { label: 'Tareas', to: '/tasks' }]} onRefresh={refetch} loading={loading} />
      <div className="flex flex-wrap gap-2">
        {['all', 'week', 'done'].map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`min-h-[44px] px-4 py-2 rounded-xl text-base font-medium ${
              filter === f
                ? 'bg-primary text-white'
                : 'bg-surface border-2 border-border text-text'
            }`}
          >
            {f === 'all' ? 'Todas' : f === 'week' ? 'Esta semana' : 'Completadas'}
          </button>
        ))}
      </div>
      <ul className="space-y-3">
        {filtered.map((t) => {
          const status = str(field(t, 'Status', 'Status'))
          const done = STATUS_DONE.includes(status)
          return (
            <li key={t.id}>
              <Link
                to={`/tasks/${t.id}`}
                className={`block rounded-xl border bg-surface p-4 hover:shadow-md transition-shadow ${
                  done
                    ? 'border-green-200 dark:border-green-800/50 opacity-90'
                    : 'border-2 border-border'
                }`}
              >
                <span className={`font-medium ${done ? 'line-through text-text-muted' : 'text-text'}`}>
                  {str(field(t, 'Task Name', 'Task Name')) || '(sin nombre)'}
                </span>
                <div className="flex flex-wrap gap-2 mt-2 text-sm text-text-muted">
                  <span>{str(field(t, 'Category', 'Category'))}</span>
                  <span>{status}</span>
                  <span>Vence: {dateStr(field(t, 'Due Date', 'Due Date')) || '—'}</span>
                  {field(t, 'Assignee', 'Assignee') && (
                    <span>Asignado: {str(field(t, 'Assignee', 'Assignee'))}</span>
                  )}
                </div>
              </Link>
            </li>
          )
        })}
      </ul>
      {filtered.length === 0 && (
        <p className="text-text-muted">No hay tareas con este filtro.</p>
      )}
    </div>
  )
}
