import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useApi } from '../lib/api'
import { Spinner } from '../components/Spinner'
import { field, str } from '../lib/normalize'

export function HabitsList() {
  const { fetchApi } = useApi()
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    fetchApi('/api/habits')
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

  if (loading) return <div className="flex justify-center py-12"><Spinner size="lg" /></div>
  if (error) return <p className="text-red-600 dark:text-red-400">{error}</p>

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-gray-900 dark:text-white">Hábitos</h1>
      <ul className="space-y-3">
        {list.map((h) => (
          <li key={h.id}>
            <Link
              to={`/habits/${h.id}`}
              className="block rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 hover:shadow-md transition-shadow"
            >
              <span className="font-medium text-gray-900 dark:text-white">
                {str(field(h, 'Habit Name', 'Habit Name')) || '(sin nombre)'}
              </span>
              <div className="flex flex-wrap gap-2 mt-2 text-sm text-gray-500 dark:text-gray-400">
                <span>{str(field(h, 'Category', 'Category'))}</span>
                <span>Frecuencia: {str(field(h, 'Frequency', 'Frequency')) || '—'}</span>
                <span>Prioridad: {str(field(h, 'Priority', 'Priority')) || '—'}</span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
      {list.length === 0 && (
        <p className="text-gray-500 dark:text-gray-400">No hay hábitos.</p>
      )}
    </div>
  )
}
