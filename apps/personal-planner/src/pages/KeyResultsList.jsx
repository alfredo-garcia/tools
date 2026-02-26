import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useApi } from '../lib/api'
import { Spinner } from '../components/Spinner'
import { field, num, str, dateStr } from '../lib/normalize'

export function KeyResultsList() {
  const { fetchApi } = useApi()
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    fetchApi('/api/key-results')
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
      <h1 className="text-xl font-bold text-gray-900 dark:text-white">Key Results</h1>
      <ul className="space-y-3">
        {list.map((kr) => {
          const progress = num(field(kr, 'Progress (%)', 'Progress', 'Progress %')) ?? 0
          return (
            <li key={kr.id}>
              <Link
                to={`/key-results/${kr.id}`}
                className="block rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 hover:shadow-md transition-shadow"
              >
                <span className="font-medium text-gray-900 dark:text-white">
                  {str(field(kr, 'Key Result Name', 'Key Result Name')) || '(sin nombre)'}
                </span>
                <div className="mt-2 flex items-center gap-3">
                  <div className="flex-1 h-2 rounded-full bg-gray-200 dark:bg-slate-600 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-sky-500"
                      style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400 w-12">
                    {progress}%
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 mt-2 text-sm text-gray-500 dark:text-gray-400">
                  <span>{str(field(kr, 'Status', 'Status'))}</span>
                  <span>Deadline: {dateStr(field(kr, 'Deadline', 'Deadline')) || '—'}</span>
                </div>
              </Link>
            </li>
          )
        })}
      </ul>
      {list.length === 0 && (
        <p className="text-gray-500 dark:text-gray-400">No hay key results.</p>
      )}
    </div>
  )
}
