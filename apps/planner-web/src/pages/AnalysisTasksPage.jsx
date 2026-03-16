import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Spinner, PageHeader, StatusProgressBar } from '@tools/shared'
import { usePlannerApi } from '../contexts/PlannerApiContext'

const TASKS_QUERY = `
  query { tasks { id taskName status } }
`

export function AnalysisTasksPage() {
  const navigate = useNavigate()
  const { graphql } = usePlannerApi()
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await graphql(TASKS_QUERY)
      setTasks(data?.tasks ?? [])
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [graphql])

  useEffect(() => {
    load()
  }, [load])

  const done = tasks.filter((t) => (t.status || '').toLowerCase() === 'done').length
  const inProgress = tasks.filter((t) => (t.status || '').toLowerCase().includes('progress')).length
  const pending = tasks.length - done - inProgress
  const total = tasks.length
  const percent = total > 0 ? Math.round((done / total) * 100) : 0

  return (
    <div className="space-y-6">
      <PageHeader title="Tasks Analysis" onRefresh={load} loading={loading} onBack={() => navigate('/analytics')} />
      {error && (
        <p className="text-red-600 dark:text-red-400 text-sm" role="alert">
          {error}
        </p>
      )}
      {loading && tasks.length === 0 ? (
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      ) : (
        <>
          <div>
            <p className="text-sm font-medium text-text mb-1">Tasks by status</p>
            <StatusProgressBar
              segments={{ done, in_progress: inProgress, pending }}
              total={total}
              ariaLabel="Tasks by status"
            />
          </div>
          <p className="text-sm text-text-muted">
            {done} done, {inProgress} in progress, {pending} pending ({percent}% complete)
          </p>
        </>
      )}
    </div>
  )
}
