import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useApi } from '../lib/api'
import { Spinner } from '../components/Spinner'
import { field, str, dateStr } from '../lib/normalize'

export function ObjectivesList() {
  const { fetchApi } = useApi()
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    fetchApi('/api/objectives')
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
      <h1 className="text-xl font-bold text-gray-900 dark:text-white">Objetivos</h1>
      <ul className="space-y-3">
        {list.map((o) => (
          <li key={o.id}>
            <Link
              to={`/objectives/${o.id}`}
              className="block rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 hover:shadow-md transition-shadow"
            >
              <span className="font-medium text-gray-900 dark:text-white">
                {str(field(o, 'Objective Name', 'Objective Name')) || '(sin nombre)'}
              </span>
              <div className="flex flex-wrap gap-2 mt-2 text-sm text-gray-500 dark:text-gray-400">
                <span>{str(field(o, 'Category', 'Category'))}</span>
                <span>{str(field(o, 'Status', 'Status'))}</span>
                <span>Hasta: {dateStr(field(o, 'Target Date', 'Target Date')) || '—'}</span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
      {list.length === 0 && (
        <p className="text-gray-500 dark:text-gray-400">No hay objetivos.</p>
      )}
    </div>
  )
}
