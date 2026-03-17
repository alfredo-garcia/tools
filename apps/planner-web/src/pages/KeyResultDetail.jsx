import { useState, useEffect, useCallback, useMemo } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  Spinner,
  PageHeader,
  Card,
  EntityDetailPage,
  IconTrash,
  Fab,
  StatusProgressBar,
  IconCheckSquare,
} from '@tools/shared'
import { usePlannerApi } from '../contexts/PlannerApiContext'
import { getTaskStatusGroup, getTaskStatusBreakdown } from '../lib/taskStatus'
import { getPriorityTagClass } from '../lib/priorityTagClass'
import { TaskModal } from '../components/TaskModal'

const KEY_RESULT_QUERY = `
  query KeyResult($id: ID!) {
    keyResult(id: $id) {
      id keyResultName status description metric currentValue targetValue unit deadline progressPercent objectiveLink lastModified
    }
  }
`
const OBJECTIVE_QUERY = `
  query Objective($id: ID!) { objective(id: $id) { id objectiveName } }
`
const TASKS_QUERY = `
  query { tasks { id taskName status description dueDate priority keyResults } }
`

const KR_STATUS_OPTIONS = [
  'Not Started',
  'In Progress',
  'Achieved',
  'Behind',
  'Missed',
]

const UPDATE_KEY_RESULT = `
  mutation UpdateKeyResult($id: ID!, $input: KeyResultUpdateInput!) {
    updateKeyResult(id: $id, input: $input) { id keyResultName status }
  }
`
const DELETE_KEY_RESULT = `
  mutation DeleteKeyResult($id: ID!) { deleteKeyResult(id: $id) }
`

function TaskCardClickable({ task, onClick }) {
  const name = (task.taskName || '').trim() || '(untitled)'
  const statusGroup = getTaskStatusGroup(task)
  const priority = task.priority || ''
  const due = task.dueDate || ''

  return (
    <button type="button" onClick={() => onClick?.(task)} className="block w-full text-left">
      <Card title={name} icon={<IconCheckSquare size={20} />}>
        <div className="flex flex-wrap items-center gap-2 mt-1">
          {priority && (
            <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${getPriorityTagClass(priority)}`}>
              {priority}
            </span>
          )}
          {due && (
            <span className="text-xs text-text-muted">{due}</span>
          )}
          {task.status && (
            <span className="text-xs px-2 py-0.5 rounded bg-primary-muted">{task.status}</span>
          )}
        </div>
      </Card>
    </button>
  )
}

export function KeyResultDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { graphql } = usePlannerApi()
  const [keyResult, setKeyResult] = useState(null)
  const [objective, setObjective] = useState(null)
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [modalTask, setModalTask] = useState(null)
  const [createTaskOpen, setCreateTaskOpen] = useState(false)

  const load = useCallback(async () => {
    if (!id) return
    setLoading(true)
    setError(null)
    try {
      const [krData, tasksData] = await Promise.all([
        graphql(KEY_RESULT_QUERY, { id }),
        graphql(TASKS_QUERY),
      ])
      const kr = krData?.keyResult ?? null
      setKeyResult(kr)
      setTasks(tasksData?.tasks ?? [])
      if (kr?.objectiveLink?.[0]) {
        const objData = await graphql(OBJECTIVE_QUERY, { id: kr.objectiveLink[0] })
        setObjective(objData?.objective ?? null)
      } else {
        setObjective(null)
      }
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [graphql, id])

  useEffect(() => {
    load()
  }, [load])

  const handleUpdate = useCallback(
    async (input) => {
      if (!keyResult?.id) return
      try {
        await graphql(UPDATE_KEY_RESULT, { id: keyResult.id, input })
        setKeyResult((prev) => (prev ? { ...prev, ...input } : null))
      } catch (err) {
        console.error(err)
      }
    },
    [graphql, keyResult?.id]
  )

  const handleDelete = useCallback(async () => {
    if (!keyResult?.id) return
    try {
      await graphql(DELETE_KEY_RESULT, { id: keyResult.id })
      navigate('/key-results')
    } catch (err) {
      console.error(err)
    }
  }, [graphql, keyResult?.id, navigate])

  const linkedTasks = useMemo(
    () => tasks.filter((t) => (t.keyResults || []).includes(id)),
    [tasks, id]
  )

  const taskBreakdown = useMemo(() => getTaskStatusBreakdown(linkedTasks), [linkedTasks])

  if (loading && !keyResult) {
    return (
      <div className="flex flex-col items-center gap-4 py-12">
        <Spinner />
        <p className="text-text-muted">Loading key result…</p>
      </div>
    )
  }

  if (!keyResult) {
    return (
      <EntityDetailPage header={<PageHeader title="Key Result" breadcrumbs={[{ label: 'Planner', to: '/' }, { label: 'Key Results', to: '/key-results' }]} />}>
        <p className="text-text-muted">{error || 'Key result not found.'}</p>
      </EntityDetailPage>
    )
  }

  const title = keyResult.keyResultName || 'Key Result'
  const progressPct =
    keyResult.progressPercent != null
      ? Math.round(keyResult.progressPercent)
      : keyResult.targetValue != null && keyResult.targetValue !== 0 && keyResult.currentValue != null
        ? Math.round((keyResult.currentValue / keyResult.targetValue) * 100)
        : null

  return (
    <EntityDetailPage
      header={
        <PageHeader
          breadcrumbs={[
            { label: 'Planner', to: '/' },
            { label: 'Key Results', to: '/key-results' },
            { label: title },
          ]}
          onRefresh={load}
          loading={loading}
        />
      }
    >
      {error && (
        <p className="text-red-600 dark:text-red-400 text-sm mb-4" role="alert">
          {error}
        </p>
      )}

      <Card className="rounded-2xl border-2 border-border">
        <div className="p-5 border-b border-border flex items-center justify-between gap-3">
          <h2 className="font-bold text-xl text-text">{title}</h2>
          <button
            type="button"
            onClick={() => window.confirm('Delete this key result?') && handleDelete()}
            className="shrink-0 p-2 rounded-lg text-text-muted hover:bg-red-500/20 hover:text-red-600 dark:hover:text-red-400"
            aria-label="Delete key result"
          >
            <IconTrash size={20} />
          </button>
        </div>
        <div className="p-5 space-y-4">
          {objective && (
            <p className="text-sm text-text-muted">
              Objective:{' '}
              <Link to={`/objectives/${objective.id}`} className="text-primary hover:underline">
                {objective.objectiveName || objective.id}
              </Link>
            </p>
          )}
          {keyResult.description && (
            <p className="text-sm text-text whitespace-pre-wrap">{keyResult.description}</p>
          )}
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
            {keyResult.metric && (
              <>
                <dt className="text-text-muted">Metric</dt>
                <dd>{keyResult.metric}</dd>
              </>
            )}
            {(keyResult.currentValue != null || keyResult.targetValue != null) && (
              <>
                <dt className="text-text-muted">Current / Target</dt>
                <dd>
                  {keyResult.currentValue ?? '–'} / {keyResult.targetValue ?? '–'} {keyResult.unit || ''}
                </dd>
              </>
            )}
            {progressPct != null && (
              <>
                <dt className="text-text-muted">Progress</dt>
                <dd>{progressPct}%</dd>
              </>
            )}
            {keyResult.deadline && (
              <>
                <dt className="text-text-muted">Deadline</dt>
                <dd>{keyResult.deadline}</dd>
              </>
            )}
          </dl>
          <div className="flex flex-wrap items-center gap-2 pt-2">
            <span className="text-sm text-text-muted">Status:</span>
            {KR_STATUS_OPTIONS.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => handleUpdate({ status: value })}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                  keyResult.status === value ? 'bg-primary text-white' : 'bg-border/50 text-text-muted hover:bg-border'
                }`}
              >
                {value}
              </button>
            ))}
          </div>
        </div>
      </Card>

      <section className="pt-4">
        <h3 className="text-lg font-bold text-text mb-2">Tasks</h3>
        {taskBreakdown.total > 0 && (
          <div className="flex items-center gap-3 mb-3">
            <span className="text-sm text-text-muted">{taskBreakdown.total} tasks</span>
            <StatusProgressBar
              segments={taskBreakdown.counts}
              total={taskBreakdown.total}
              ariaLabel="Tasks progress"
              className="max-w-[200px]"
            />
          </div>
        )}
        <ul className="space-y-2 list-none p-0 m-0">
          {linkedTasks.map((task) => (
            <li key={task.id}>
              <TaskCardClickable task={task} onClick={setModalTask} />
            </li>
          ))}
        </ul>
      </section>

      <Fab onClick={() => setCreateTaskOpen(true)} ariaLabel="Create task" />
      {createTaskOpen && (
        <TaskModal
          task={null}
          onClose={() => setCreateTaskOpen(false)}
          onSaved={load}
          initialValues={{ keyResults: [id] }}
        />
      )}
      {modalTask && (
        <TaskModal task={modalTask} onClose={() => setModalTask(null)} onSaved={load} />
      )}
    </EntityDetailPage>
  )
}
