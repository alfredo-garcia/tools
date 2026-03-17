import { useState, useEffect, useCallback, useMemo } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  Spinner,
  PageHeader,
  Card,
  EntityDetailPage,
  IconTarget,
  IconPriority,
  IconCalendar,
  IconTag,
  IconCircle,
  IconPlay,
  IconCheckSquare,
  IconTrash,
  Fab,
  StatusProgressBar,
} from '@tools/shared'
import { usePlannerApi } from '../contexts/PlannerApiContext'
import { getTaskStatusGroup } from '../lib/taskStatus'
import { getPriorityTagClass } from '../lib/priorityTagClass'
import { KeyResultCreateModal } from '../components/KeyResultCreateModal'

const OBJECTIVE_QUERY = `
  query Objective($id: ID!) { objective(id: $id) { id objectiveName status description category priority startDate targetDate lastModified } }
`
const KEY_RESULTS_QUERY = `
  query { keyResults { id keyResultName status objectiveLink } }
`
const TASKS_QUERY = `
  query { tasks { id taskName status keyResults } }
`

const STATUS_OPTIONS = [
  { value: 'Pending', label: 'Pending', Icon: IconCircle },
  { value: 'In Progress', label: 'In progress', Icon: IconPlay },
  { value: 'Done', label: 'Done', Icon: IconCheckSquare },
]
const PRIORITY_OPTIONS = ['Low', 'Medium', 'High']

function KeyResultCard({ kr, taskStats }) {
  const name = kr.keyResultName || '(untitled)'
  const totalTasks = taskStats?.total ?? 0
  const done = taskStats?.done ?? 0
  const inProgress = taskStats?.in_progress ?? 0
  const pending = taskStats?.pending ?? 0
  const donePct = totalTasks === 0 ? 0 : Math.round((done / totalTasks) * 100)
  const inProgressPct = totalTasks === 0 ? 0 : Math.round((inProgress / totalTasks) * 100)
  const pendingPct = totalTasks === 0 ? 0 : Math.round((pending / totalTasks) * 100)

  return (
    <Link to={`/key-results/${kr.id}`} className="block">
      <Card title={name} className="hover:ring-2 hover:ring-primary/30 transition-shadow">
        <div className="space-y-2">
          {totalTasks > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-text-muted shrink-0">({totalTasks})</span>
              <div className="flex-1 h-2 rounded-full overflow-hidden flex min-w-0" role="progressbar">
                {donePct > 0 && <div className="h-full bg-status-done shrink-0" style={{ width: `${donePct}%` }} />}
                {inProgressPct > 0 && <div className="h-full bg-status-in-progress shrink-0" style={{ width: `${inProgressPct}%` }} />}
                {pendingPct > 0 && <div className="h-full bg-status-pending shrink-0" style={{ width: `${pendingPct}%` }} />}
              </div>
              <span className="text-xs font-medium text-text-muted shrink-0">{donePct}%</span>
            </div>
          )}
          {kr.status && <span className="text-xs text-text-muted">{kr.status}</span>}
        </div>
      </Card>
    </Link>
  )
}

const UPDATE_OBJECTIVE = `
  mutation UpdateObjective($id: ID!, $input: ObjectiveUpdateInput!) {
    updateObjective(id: $id, input: $input) { id objectiveName status description category priority startDate targetDate }
  }
`
const DELETE_OBJECTIVE = `
  mutation DeleteObjective($id: ID!) { deleteObjective(id: $id) }
`

export function ObjectiveDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { graphql } = usePlannerApi()
  const [objective, setObjective] = useState(null)
  const [keyResults, setKeyResults] = useState([])
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [editingField, setEditingField] = useState(null)
  const [editValue, setEditValue] = useState('')
  const [createKrOpen, setCreateKrOpen] = useState(false)

  const load = useCallback(async () => {
    if (!id) return
    setLoading(true)
    setError(null)
    try {
      const [objData, krData, tasksData] = await Promise.all([
        graphql(OBJECTIVE_QUERY, { id }),
        graphql(KEY_RESULTS_QUERY),
        graphql(TASKS_QUERY),
      ])
      setObjective(objData?.objective ?? null)
      setKeyResults(krData?.keyResults ?? [])
      setTasks(tasksData?.tasks ?? [])
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
      if (!objective?.id) return
      try {
        await graphql(UPDATE_OBJECTIVE, { id: objective.id, input })
        setObjective((prev) => (prev ? { ...prev, ...input } : null))
        setEditingField(null)
      } catch (err) {
        console.error(err)
      }
    },
    [graphql, objective?.id]
  )

  const handleStatus = useCallback(
    async (newStatus) => {
      if (!objective?.id) return
      try {
        await graphql(UPDATE_OBJECTIVE, { id: objective.id, input: { status: newStatus } })
        setObjective((prev) => (prev ? { ...prev, status: newStatus } : null))
      } catch (err) {
        console.error(err)
      }
    },
    [graphql, objective?.id]
  )

  const handleDelete = useCallback(async () => {
    if (!objective?.id) return
    try {
      await graphql(DELETE_OBJECTIVE, { id: objective.id })
      navigate('/objectives')
    } catch (err) {
      console.error(err)
    }
  }, [graphql, objective?.id, navigate])

  const objectiveKrs = useMemo(
    () => keyResults.filter((kr) => (kr.objectiveLink || []).includes(id)),
    [keyResults, id]
  )

  const krStatusCounts = useMemo(() => {
    const done = objectiveKrs.filter((kr) => getTaskStatusGroup(kr) === 'done').length
    const inProgress = objectiveKrs.filter((kr) => getTaskStatusGroup(kr) === 'in_progress').length
    const pending = objectiveKrs.filter((kr) => getTaskStatusGroup(kr) === 'pending').length
    return { done, in_progress: inProgress, pending, total: objectiveKrs.length }
  }, [objectiveKrs])

  const krTasksStatsById = useMemo(() => {
    const map = {}
    objectiveKrs.forEach((kr) => {
      const tasksForKr = tasks.filter((t) => (t.keyResults || []).includes(kr.id))
      const done = tasksForKr.filter((t) => getTaskStatusGroup(t) === 'done').length
      const inProgress = tasksForKr.filter((t) => getTaskStatusGroup(t) === 'in_progress').length
      const pending = tasksForKr.filter((t) => getTaskStatusGroup(t) === 'pending').length
      map[kr.id] = { total: tasksForKr.length, done, in_progress: inProgress, pending }
    })
    return map
  }, [objectiveKrs, tasks])

  if (loading && !objective) {
    return (
      <div className="flex flex-col items-center gap-4 py-12">
        <Spinner />
        <p className="text-text-muted">Loading objective…</p>
      </div>
    )
  }

  if (!objective) {
    return (
      <EntityDetailPage header={<PageHeader title="Objective" breadcrumbs={[{ label: 'Planner', to: '/' }, { label: 'OKRs', to: '/objectives' }]} />}>
        <p className="text-text-muted">{error || 'Objective not found.'}</p>
      </EntityDetailPage>
    )
  }

  const title = objective.objectiveName || 'Objective'
  const description = objective.description || ''
  const category = objective.category || ''
  const priority = objective.priority || ''
  const startDate = objective.startDate || ''
  const targetDate = objective.targetDate || ''

  const startEdit = (fieldName, currentValue) => {
    setEditingField(fieldName)
    setEditValue(currentValue ?? '')
  }

  return (
    <EntityDetailPage
      header={
        <PageHeader
          breadcrumbs={[{ label: 'Planner', to: '/' }, { label: 'OKRs', to: '/objectives' }, { label: title }]}
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
          {editingField === 'name' ? (
            <input
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={() => {
                const v = (editValue || '').trim() || '(untitled)'
                handleUpdate({ objectiveName: v })
                setEditingField(null)
              }}
              onKeyDown={(e) => e.key === 'Enter' && e.target.blur()}
              className="flex-1 min-w-0 font-bold text-xl text-text bg-surface border border-border rounded-lg px-2 py-1"
              autoFocus
            />
          ) : (
            <h2
              role="button"
              tabIndex={0}
              onClick={() => startEdit('name', title)}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && startEdit('name', title)}
              className="font-bold text-xl text-text truncate flex-1 min-w-0 cursor-pointer rounded hover:bg-border/50 py-1 -mx-1 px-1 flex items-center gap-2"
            >
              <IconTarget size={22} className="text-text-muted shrink-0" />
              {title || '(untitled)'}
            </h2>
          )}
          <button
            type="button"
            onClick={() => (window.confirm('Delete this objective?') && handleDelete())}
            className="shrink-0 p-2 rounded-lg text-text-muted hover:bg-red-500/20 hover:text-red-600 dark:hover:text-red-400"
            aria-label="Delete objective"
          >
            <IconTrash size={20} />
          </button>
        </div>
        <div className="p-5 space-y-4">
          {editingField === 'description' ? (
            <textarea
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={() => {
                handleUpdate({ description: editValue })
                setEditingField(null)
              }}
              className="w-full text-sm text-text bg-surface border border-border rounded-lg px-3 py-2 min-h-[80px] resize-y"
              placeholder="Description"
              autoFocus
            />
          ) : (
            <p
              role="button"
              tabIndex={0}
              onClick={() => startEdit('description', description)}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && startEdit('description', description)}
              className="text-sm text-text whitespace-pre-wrap cursor-pointer rounded hover:bg-border/50 py-2 -mx-2 px-2 min-h-[2rem]"
            >
              {description || '(no description)'}
            </p>
          )}
          <hr className="border-border" />
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 text-sm">
              <IconPriority size={18} className="text-text-muted shrink-0" />
              <span className="text-text-muted shrink-0">Priority:</span>
              {editingField === 'priority' ? (
                <select
                  value={editValue}
                  onChange={(e) => {
                    handleUpdate({ priority: e.target.value })
                    setEditingField(null)
                  }}
                  onBlur={() => setEditingField(null)}
                  className="rounded border border-border bg-surface text-text px-2 py-1 text-sm"
                  autoFocus
                >
                  <option value="">—</option>
                  {PRIORITY_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              ) : (
                <span
                  role="button"
                  tabIndex={0}
                  onClick={() => startEdit('priority', priority)}
                  onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && startEdit('priority', priority)}
                  className={`inline-flex px-1.5 py-0.5 rounded text-xs font-medium cursor-pointer ${getPriorityTagClass(priority)}`}
                >
                  {priority || '—'}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm">
              <IconTag size={18} className="text-text-muted shrink-0" />
              <span className="text-text-muted shrink-0">Category:</span>
              {editingField === 'category' ? (
                <input
                  type="text"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onBlur={() => {
                    handleUpdate({ category: editValue.trim() })
                    setEditingField(null)
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && e.target.blur()}
                  className="rounded border border-border bg-surface text-text px-2 py-1 text-sm w-40"
                  autoFocus
                />
              ) : (
                <span
                  role="button"
                  tabIndex={0}
                  onClick={() => startEdit('category', category)}
                  onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && startEdit('category', category)}
                  className="cursor-pointer rounded hover:bg-border/50 px-1"
                >
                  {category || '—'}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm">
              <IconCalendar size={18} className="text-text-muted shrink-0" />
              <span className="text-text-muted shrink-0">Start:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => handleUpdate({ startDate: e.target.value || undefined })}
                className="rounded border border-border bg-surface text-text px-2 py-1 text-sm"
              />
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-text-muted shrink-0">Target:</span>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => handleUpdate({ targetDate: e.target.value || undefined })}
                className="rounded border border-border bg-surface text-text px-2 py-1 text-sm"
              />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 pt-2">
            <span className="text-sm text-text-muted">Status:</span>
            {STATUS_OPTIONS.map(({ value, label, Icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => handleStatus(value)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  objective.status === value
                    ? value === 'Done'
                      ? 'bg-status-done text-white'
                      : value === 'In Progress'
                        ? 'bg-status-in-progress text-white'
                        : 'bg-status-pending text-white'
                    : 'bg-border/50 text-text-muted hover:bg-border'
                }`}
              >
                <Icon size={16} />
                {label}
              </button>
            ))}
          </div>
        </div>
      </Card>

      <section className="pt-4">
        <h3 className="text-lg font-bold text-text mb-2">Key Results</h3>
        {krStatusCounts.total > 0 && (
          <div className="flex items-center gap-3 mb-3">
            <span className="text-sm text-text-muted">{krStatusCounts.total} key results</span>
            <StatusProgressBar
              segments={krStatusCounts}
              total={krStatusCounts.total}
              ariaLabel="Key results progress"
              className="max-w-[200px]"
            />
          </div>
        )}
        <ul className="space-y-2 list-none p-0 m-0">
          {objectiveKrs.map((kr) => (
            <li key={kr.id}>
              <KeyResultCard kr={kr} taskStats={krTasksStatsById[kr.id]} />
            </li>
          ))}
        </ul>
      </section>

      <Fab onClick={() => setCreateKrOpen(true)} ariaLabel="Create key result" />
      {createKrOpen && (
        <KeyResultCreateModal
          objectiveId={id}
          onClose={() => setCreateKrOpen(false)}
          onSaved={load}
        />
      )}
    </EntityDetailPage>
  )
}
