import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useApi } from '../lib/api'
import { Spinner } from '../components/Spinner'
import { PageHeader } from '../components/PageHeader'
import { field, str } from '../lib/normalize'

export function HabitsList() {
  const { fetchApi } = useApi()
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const refetch = useCallback(() => {
    setLoading(true)
    setError(null)
    fetchApi('/api/habits')
      .then((r) => setList(r.data || []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [fetchApi])

  useEffect(() => {
    refetch()
  }, [refetch])

  if (loading && list.length === 0) return <div className="flex justify-center py-12"><Spinner size="lg" /></div>
  if (error && list.length === 0) return <p className="text-red-600 dark:text-red-400">{error}</p>

  return (
    <div className="space-y-6">
      <PageHeader title="Hábitos" onRefresh={refetch} loading={loading} />
      <ul className="space-y-3">
        {list.map((h) => (
          <li key={h.id}>
            <Link
              to={`/habits/${h.id}`}
              className="block rounded-xl border border-2 border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 hover:shadow-md transition-shadow"
            >
              <span className="font-medium text-neutral-900 dark:text-white">
                {str(field(h, 'Habit Name', 'Habit Name')) || '(sin nombre)'}
              </span>
              <div className="flex flex-wrap gap-2 mt-2 text-sm text-neutral-500 dark:text-neutral-400">
                <span>{str(field(h, 'Category', 'Category'))}</span>
                <span>Frecuencia: {str(field(h, 'Frequency', 'Frequency')) || '—'}</span>
                <span>Prioridad: {str(field(h, 'Priority', 'Priority')) || '—'}</span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
      {list.length === 0 && (
        <p className="text-neutral-500 dark:text-neutral-400">No hay hábitos.</p>
      )}
    </div>
  )
}
