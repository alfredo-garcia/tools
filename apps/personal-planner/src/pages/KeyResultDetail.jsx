import { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useApi } from '../lib/api'
import { Spinner } from '../components/Spinner'
import { PageHeader } from '../components/PageHeader'
import { field, num, str, dateStr, arr } from '../lib/normalize'

export function KeyResultDetail() {
  const { id } = useParams()
  const { fetchApi } = useApi()
  const [item, setItem] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const refetch = useCallback(() => {
    setLoading(true)
    setError(null)
    fetchApi('/api/key-results')
      .then((r) => setItem((r.data || []).find((kr) => kr.id === id) || null))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [fetchApi, id])

  useEffect(() => {
    refetch()
  }, [refetch])

  if (loading && !item) return <div className="flex justify-center py-12"><Spinner size="lg" /></div>
  if (error && !item) return <p className="text-red-600 dark:text-red-400">{error}</p>
  if (!item) return <p className="text-neutral-500">Key Result no encontrado.</p>

  const progress = num(field(item, 'Progress (%)', 'Progress', 'Progress %')) ?? 0
  const target = num(field(item, 'Target Value', 'Target Value'))
  const current = num(field(item, 'Current Value', 'Current Value'))
  const rows = [
    ['Descripción', str(field(item, 'Description', 'Description'))],
    ['Métrica', str(field(item, 'Metric', 'Metric'))],
    ['Valor actual', current != null ? current : str(field(item, 'Current Value', 'Current Value'))],
    ['Valor objetivo', target != null ? target : str(field(item, 'Target Value', 'Target Value'))],
    ['Unidad', str(field(item, 'Unit', 'Unit'))],
    ['Estado', str(field(item, 'Status', 'Status'))],
    ['Deadline', dateStr(field(item, 'Deadline', 'Deadline'))],
  ]

  const title = str(field(item, 'Key Result Name', 'Key Result Name')) || 'Key Result'

  return (
    <div className="space-y-6">
      <Link to="/key-results" className="text-sm text-orange-500 dark:text-orange-400 hover:underline">
        ← Volver a Key Results
      </Link>
      <PageHeader title={title} onRefresh={refetch} loading={loading} />
      <div className="rounded-2xl border border-2 border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden">
        <div className="p-6 border-b border-neutral-200 dark:border-neutral-700">
          <div className="mt-2">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-neutral-500 dark:text-neutral-400">Progreso</span>
              <span className="font-medium text-neutral-900 dark:text-white">{progress}%</span>
            </div>
            <div className="h-3 rounded-full bg-neutral-200 dark:bg-neutral-700 overflow-hidden">
              <div
                className="h-full rounded-full bg-orange-500 transition-all"
                style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
              />
            </div>
          </div>
          <dl className="mt-4 grid gap-2 sm:grid-cols-2">
            {rows.map(([label, value]) =>
              value !== '' && value != null ? (
                <div key={label}>
                  <dt className="text-sm text-neutral-500 dark:text-neutral-400">{label}</dt>
                  <dd className="text-neutral-900 dark:text-white">{value}</dd>
                </div>
              ) : null
            )}
          </dl>
        </div>
        {(() => {
          const link = arr(field(item, 'Objective Link', 'Objective'))[0]
          if (!link) return null
          return (
            <div className="p-6">
              <h2 className="text-base font-semibold text-neutral-800 dark:text-white mb-2">
                Objetivo vinculado
              </h2>
              <Link to={`/objectives/${link}`} className="text-orange-500 dark:text-orange-400 hover:underline">
                Ver objetivo →
              </Link>
            </div>
          )
        })()}
      </div>
    </div>
  )
}
