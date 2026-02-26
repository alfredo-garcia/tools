import { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useApi } from '../lib/api'
import { Spinner } from '../components/Spinner'
import { PageHeader } from '../components/PageHeader'
import { field, str, dateStr, arr } from '../lib/normalize'

export function ObjectiveDetail() {
  const { id } = useParams()
  const { fetchApi } = useApi()
  const [item, setItem] = useState(null)
  const [keyResults, setKeyResults] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const refetch = useCallback(() => {
    setLoading(true)
    setError(null)
    Promise.all([
      fetchApi('/api/objectives').then((r) => r.data.find((o) => o.id === id) || null),
      fetchApi('/api/key-results').then((r) => r.data),
    ])
      .then(([obj, krs]) => {
        setItem(obj)
        setKeyResults(
          (krs || []).filter((kr) => {
            const link = arr(field(kr, 'Objective Link', 'Objective'))
            return obj && link.includes(obj.id)
          })
        )
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [fetchApi, id])

  useEffect(() => {
    refetch()
  }, [refetch])

  if (loading && !item) return <div className="flex justify-center py-12"><Spinner size="lg" /></div>
  if (error && !item) return <p className="text-red-600 dark:text-red-400">{error}</p>
  if (!item) return <p className="text-neutral-500">Objetivo no encontrado.</p>

  const rows = [
    ['Nombre', str(field(item, 'Objective Name', 'Objective Name'))],
    ['Descripción', str(field(item, 'Description', 'Description'))],
    ['Categoría', str(field(item, 'Category', 'Category'))],
    ['Estado', str(field(item, 'Status', 'Status'))],
    ['Prioridad', str(field(item, 'Priority', 'Priority'))],
    ['Fecha inicio', dateStr(field(item, 'Start Date', 'Start Date'))],
    ['Fecha objetivo', dateStr(field(item, 'Target Date', 'Target Date'))],
  ]

  const title = str(field(item, 'Objective Name', 'Objective Name')) || 'Objetivo'

  return (
    <div className="space-y-6">
      <Link to="/objectives" className="text-sm text-orange-500 dark:text-orange-400 hover:underline">
        ← Volver a Objetivos
      </Link>
      <PageHeader title={title} onRefresh={refetch} loading={loading} />
      <div className="rounded-2xl border border-2 border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden">
        <div className="p-6 border-b border-neutral-200 dark:border-neutral-700">
          <dl className="grid gap-2 sm:grid-cols-2">
            {rows.map(([label, value]) =>
              value ? (
                <div key={label}>
                  <dt className="text-sm text-neutral-500 dark:text-neutral-400">{label}</dt>
                  <dd className="text-neutral-900 dark:text-white">{value}</dd>
                </div>
              ) : null
            )}
          </dl>
        </div>
        {keyResults.length > 0 && (
          <div className="p-6">
            <h2 className="text-base font-semibold text-neutral-800 dark:text-white mb-3">
              Key Results vinculados
            </h2>
            <ul className="space-y-2">
              {keyResults.map((kr) => (
                <li key={kr.id}>
                  <Link
                    to={`/key-results/${kr.id}`}
                    className="text-orange-500 dark:text-orange-400 hover:underline"
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
