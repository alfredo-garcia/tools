import { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useApi, Spinner, PageHeader } from '@tools/shared'
import { field, str, dateStr, arr } from '../lib/normalize'

export function TaskDetail() {
  const { id } = useParams()
  const { fetchApi } = useApi()
  const [item, setItem] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const refetch = useCallback(() => {
    setLoading(true)
    setError(null)
    fetchApi('/api/tasks')
      .then((r) => setItem((r.data || []).find((t) => t.id === id) || null))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [fetchApi, id])

  useEffect(() => {
    refetch()
  }, [refetch])

  if (loading && !item) return <div className="flex justify-center py-12"><Spinner size="lg" /></div>
  if (error && !item) return <p className="text-red-600 dark:text-red-400">{error}</p>
  if (!item) return <p className="text-text-muted">Tarea no encontrada.</p>

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

  const title = str(field(item, 'Task Name', 'Task Name')) || 'Tarea'

  return (
    <div className="space-y-6">
      <Link to="/tasks" className="text-sm text-primary hover:underline">
        ← Volver a Tareas
      </Link>
      <PageHeader breadcrumbs={[{ label: 'Home', to: '/' }, { label: 'Tareas', to: '/tasks' }, { label: title }]} onRefresh={refetch} loading={loading} />
      <div className="rounded-2xl border border-2 border-border bg-surface overflow-hidden">
        <div className="p-6">
          <dl className="grid gap-2 sm:grid-cols-2">
            {rows.map(([label, value]) =>
              value ? (
                <div key={label}>
                  <dt className="text-sm text-text-muted">{label}</dt>
                  <dd className="text-text">{value}</dd>
                </div>
              ) : null
            )}
          </dl>
          {(objLinks.length > 0 || krLinks.length > 0) && (
            <div className="mt-4 pt-4 border-t border-border">
              <h2 className="text-sm font-semibold text-text-muted mb-2">Vinculado a</h2>
              <div className="flex flex-wrap gap-2">
                {objLinks.map((oid) => (
                  <Link key={oid} to={`/objectives/${oid}`} className="text-primary hover:underline text-sm">
                    Objetivo
                  </Link>
                ))}
                {krLinks.map((krid) => (
                  <Link key={krid} to={`/key-results/${krid}`} className="text-primary hover:underline text-sm">
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
