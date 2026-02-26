import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useApi } from '../lib/api'
import { Spinner } from '../components/Spinner'
import { field, str, dateStr, arr } from '../lib/normalize'

export function ObjectiveDetail() {
  const { id } = useParams()
  const { fetchApi } = useApi()
  const [item, setItem] = useState(null)
  const [keyResults, setKeyResults] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    Promise.all([
      fetchApi('/api/objectives').then((r) => r.data.find((o) => o.id === id) || null),
      fetchApi('/api/key-results').then((r) => r.data),
    ])
      .then(([obj, krs]) => {
        if (!cancelled) {
          setItem(obj)
          const linkIds = obj ? arr(field(obj, 'Key Results', 'Key Result Link')) : []
          setKeyResults(
            krs.filter((kr) => {
              const link = arr(field(kr, 'Objective Link', 'Objective'))
              return obj && link.includes(obj.id)
            })
          )
        }
      })
      .catch((e) => {
        if (!cancelled) setError(e.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [fetchApi, id])

  if (loading) return <div className="flex justify-center py-12"><Spinner size="lg" /></div>
  if (error) return <p className="text-red-600 dark:text-red-400">{error}</p>
  if (!item) return <p className="text-gray-500">Objetivo no encontrado.</p>

  const rows = [
    ['Nombre', str(field(item, 'Objective Name', 'Objective Name'))],
    ['Descripción', str(field(item, 'Description', 'Description'))],
    ['Categoría', str(field(item, 'Category', 'Category'))],
    ['Estado', str(field(item, 'Status', 'Status'))],
    ['Prioridad', str(field(item, 'Priority', 'Priority'))],
    ['Fecha inicio', dateStr(field(item, 'Start Date', 'Start Date'))],
    ['Fecha objetivo', dateStr(field(item, 'Target Date', 'Target Date'))],
  ]

  return (
    <div className="space-y-6">
      <Link to="/objectives" className="text-sm text-sky-600 dark:text-sky-400 hover:underline">
        ← Volver a Objetivos
      </Link>
      <div className="rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden">
        <div className="p-6 border-b border-gray-100 dark:border-slate-700">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            {str(field(item, 'Objective Name', 'Objective Name')) || '(sin nombre)'}
          </h1>
          <dl className="mt-4 grid gap-2 sm:grid-cols-2">
            {rows.map(([label, value]) =>
              value ? (
                <div key={label}>
                  <dt className="text-sm text-gray-500 dark:text-gray-400">{label}</dt>
                  <dd className="text-gray-900 dark:text-white">{value}</dd>
                </div>
              ) : null
            )}
          </dl>
        </div>
        {keyResults.length > 0 && (
          <div className="p-6">
            <h2 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-3">
              Key Results vinculados
            </h2>
            <ul className="space-y-2">
              {keyResults.map((kr) => (
                <li key={kr.id}>
                  <Link
                    to={`/key-results/${kr.id}`}
                    className="text-sky-600 dark:text-sky-400 hover:underline"
                  >
                    {str(field(kr, 'Key Result Name', 'Key Result Name')) || kr.id}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
