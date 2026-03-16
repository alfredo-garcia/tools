import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Spinner, PageHeader, Card, CardList, EntityListPage, IconCheckSquare } from '@tools/shared'
import { usePlannerApi } from '../contexts/PlannerApiContext'

const TASKS_QUERY = `
  query { tasks { id taskName status description dueDate priority lastModified } }
`

export function TasksList() {
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

  return (
    <EntityListPage
      header={<PageHeader title="Tasks" onRefresh={load} loading={loading} />}
      showEmptyState={!loading && tasks.length === 0}
      emptyState={
        <p className="text-text-muted text-center py-8">No tasks yet. Create one from the planner or add here.</p>
      }
    >
      {error && (
        <p className="text-red-600 dark:text-red-400 text-sm mb-4" role="alert">
          {error}
        </p>
      )}
      {loading && tasks.length === 0 ? (
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      ) : (
        <CardList>
          {tasks.map((task) => (
            <Card
              key={task.id}
              title={task.taskName || '(untitled)'}
              icon={<IconCheckSquare size={20} />}
              className="cursor-pointer"
              onClick={() => navigate(`/tasks/${task.id}`)}
            >
              {task.description && (
                <p className="text-sm text-text-muted line-clamp-2">{task.description}</p>
              )}
              <div className="flex flex-wrap gap-2 mt-2">
                {task.dueDate && (
                  <span className="text-xs text-text-muted">{task.dueDate}</span>
                )}
                {task.priority && (
                  <span className="text-xs px-2 py-0.5 rounded bg-border">{task.priority}</span>
                )}
                {task.status && (
                  <span className="text-xs px-2 py-0.5 rounded bg-primary-muted">{task.status}</span>
                )}
              </div>
            </Card>
          ))}
        </CardList>
      )}
    </EntityListPage>
  )
}
