import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Spinner, PageHeader, EntityDetailPage } from '@tools/shared'
import { usePlannerApi } from '../contexts/PlannerApiContext'

const TASK_QUERY = `
  query Task($id: ID!) { task(id: $id) { id taskName status description dueDate priority assignee category lastModified } }
`

export function TaskDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { graphql } = usePlannerApi()
  const [task, setTask] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    if (!id) return
    setLoading(true)
    setError(null)
    try {
      const data = await graphql(TASK_QUERY, { id })
      setTask(data?.task ?? null)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [graphql, id])

  useEffect(() => {
    load()
  }, [load])

  if (loading && !task) {
    return (
      <div className="flex flex-col items-center gap-4 py-12">
        <Spinner />
        <p className="text-text-muted">Loading task…</p>
      </div>
    )
  }

  if (!task) {
    return (
      <EntityDetailPage
        header={<PageHeader title="Task" onBack={() => navigate('/tasks')} />}
      >
        <p className="text-text-muted">{error || 'Task not found.'}</p>
      </EntityDetailPage>
    )
  }

  return (
    <EntityDetailPage
      header={<PageHeader title={task.taskName || 'Task'} onBack={() => navigate('/tasks')} />}
    >
      {error && (
        <p className="text-red-600 dark:text-red-400 text-sm mb-4" role="alert">{error}</p>
      )}
      <dl className="space-y-2 text-sm">
        {task.status && <><dt className="text-text-muted">Status</dt><dd>{task.status}</dd></>}
        {task.dueDate && <><dt className="text-text-muted">Due</dt><dd>{task.dueDate}</dd></>}
        {task.priority && <><dt className="text-text-muted">Priority</dt><dd>{task.priority}</dd></>}
        {task.description && <><dt className="text-text-muted">Description</dt><dd className="whitespace-pre-wrap">{task.description}</dd></>}
      </dl>
    </EntityDetailPage>
  )
}
