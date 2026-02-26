import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useApi } from '../lib/api'
import { Spinner } from '../components/Spinner'
import { field, str, dateStr, arr } from '../lib/normalize'

export function TaskDetail() {
  const { id } = useParams()
  const { fetchApi } = useApi()
  const [item, setItem] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    fetchApi('/api/tasks')
      .then((r) => {
        const found = (r.data || []).find((t) => t.id === id)
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
  if (!item) return <p className="text-gray-500">Tarea no encontrada.</p>

  const rows = [
    ['Descripción', str(field(item, 'Description', 'Description'))],
    ['Categoría', str(field(item, 'Category', 'Category'))],
    ['Prioridad', str(field(item, 'Priority', 'Priority'))],
    ['Estado', str(field(item, 'Status', 'Status'))],
    ['Asignado', str(field(item, 'Assignee', 'Assignee'))],
    ['Fecha límite', dateStr(field(item, 'Due Date', 'Due Date'))],
  ]

  const objLinks = arr(field(item, 'Objectives', 'Objective'))
  const krLinks = arr(field(item, 'Key Result', 'Key Results'))

  return (
    <div className="space-y-6">
      <Link to="/tasks" className="text-sm text-sky-600 dark:text-sky-400 hover:underline">
        ← Volver a Tareas
      </Link>
      <div className="rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden">
        <div className="p-6">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            {str(field(item, 'Task Name', 'Task Name')) || '(sin nombre)'}
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
          {(objLinks.length > 0 || krLinks.length > 0) && (
            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-slate-700">
              <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Vinculado a</h2>
              <div className="flex flex-wrap gap-2">
                {objLinks.map((oid) => (
                  <Link key={oid} to={`/objectives/${oid}`} className="text-sky-600 dark:text-sky-400 hover:underline text-sm">
                    Objetivo
                  </Link>
                ))}
                {krLinks.map((krid) => (
                  <Link key={krid} to={`/key-results/${krid}`} className="text-sky-600 dark:text-sky-400 hover:underline text-sm">
                    Key Result
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
