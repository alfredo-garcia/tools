import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useApi } from '../lib/api'
import { Spinner } from '../components/Spinner'
import { field, str, dateStr } from '../lib/normalize'

const STATUS_DONE = ['Done', 'Complete', 'Completado', 'Hecho', 'Cerrado']

export function TasksList() {
  const { fetchApi } = useApi()
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('all') // all | week | done

  useEffect(() => {
    let cancelled = false
    fetchApi('/api/tasks')
      .then((r) => {
        if (!cancelled) setList(r.data || [])
      })
      .catch((e) => {
        if (!cancelled) setError(e.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [fetchApi])

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

  if (loading) return <div className="flex justify-center py-12"><Spinner size="lg" /></div>
  if (error) return <p className="text-red-600 dark:text-red-400">{error}</p>

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-gray-900 dark:text-white">Tareas</h1>
      <div className="flex flex-wrap gap-2">
        {['all', 'week', 'done'].map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`min-h-[44px] px-4 py-2 rounded-xl text-base font-medium ${
              filter === f
                ? 'bg-sky-600 text-white'
                : 'bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 text-gray-700 dark:text-gray-300'
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
                className={`block rounded-xl border bg-white dark:bg-slate-800 p-4 hover:shadow-md transition-shadow ${
                  done
                    ? 'border-green-200 dark:border-green-800/50 opacity-90'
                    : 'border-gray-200 dark:border-slate-700'
                }`}
              >
                <span className={`font-medium ${done ? 'line-through text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-white'}`}>
                  {str(field(t, 'Task Name', 'Task Name')) || '(sin nombre)'}
                </span>
                <div className="flex flex-wrap gap-2 mt-2 text-sm text-gray-500 dark:text-gray-400">
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
        <p className="text-gray-500 dark:text-gray-400">No hay tareas con este filtro.</p>
      )}
    </div>
  )
}
