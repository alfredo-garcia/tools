import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useApi } from '../lib/api'
import { Spinner } from '../components/Spinner'
import { field, num, str, dateStr, arr } from '../lib/normalize'

export function KeyResultDetail() {
  const { id } = useParams()
  const { fetchApi } = useApi()
  const [item, setItem] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    fetchApi('/api/key-results')
      .then((r) => {
        const found = (r.data || []).find((kr) => kr.id === id)
        if (!cancelled) setItem(found)
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
  if (!item) return <p className="text-gray-500">Key Result no encontrado.</p>

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

  return (
    <div className="space-y-6">
      <Link to="/key-results" className="text-sm text-sky-600 dark:text-sky-400 hover:underline">
        ← Volver a Key Results
      </Link>
      <div className="rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden">
        <div className="p-6 border-b border-gray-100 dark:border-slate-700">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            {str(field(item, 'Key Result Name', 'Key Result Name')) || '(sin nombre)'}
          </h1>
          <div className="mt-4">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-500 dark:text-gray-400">Progreso</span>
              <span className="font-medium text-gray-900 dark:text-white">{progress}%</span>
            </div>
            <div className="h-3 rounded-full bg-gray-200 dark:bg-slate-600 overflow-hidden">
              <div
                className="h-full rounded-full bg-sky-500 transition-all"
                style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
              />
            </div>
          </div>
          <dl className="mt-4 grid gap-2 sm:grid-cols-2">
            {rows.map(([label, value]) =>
              value !== '' && value != null ? (
                <div key={label}>
                  <dt className="text-sm text-gray-500 dark:text-gray-400">{label}</dt>
                  <dd className="text-gray-900 dark:text-white">{value}</dd>
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
              <h2 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-2">
                Objetivo vinculado
              </h2>
              <Link to={`/objectives/${link}`} className="text-sky-600 dark:text-sky-400 hover:underline">
                Ver objetivo →
              </Link>
            </div>
          )
        })()}
      </div>
    </div>
  )
}
