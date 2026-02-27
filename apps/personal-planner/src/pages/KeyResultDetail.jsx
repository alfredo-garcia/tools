import { useState, useEffect, useCallback, useMemo } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useApi, Spinner, PageHeader, Card, CardList, IconTarget, IconCalendar, IconTag, IconCircle, IconPlay, IconCheckSquare, IconTrash } from '@tools/shared'
import { field, str, dateStr, arr, num } from '@tools/shared'
import { getTaskStatusGroup } from '../lib/taskStatus'
import { getPriorityTagClass, STATUS_OPTIONS } from '../components/TaskCard'
import { TaskModal } from '../components/TaskModal'

const GROUP_ORDER = ['in_progress', 'pending', 'done']
const GROUP_LABELS = { in_progress: 'In progress', pending: 'Pending', done: 'Done' }

function TaskCardClickable({ task, getDue, onClick }) {
  const name = str(field(task, 'Task Name', 'Task Name')) || '(untitled)'
  const description = str(field(task, 'Description', 'Description')) || ''
  const priority = str(field(task, 'Priority', 'Priority'))
  const due = getDue(task)
  const statusGroup = getTaskStatusGroup(task)
  const isDone = statusGroup === 'done'

  return (
    <button type="button" onClick={() => onClick?.(task)} className="block w-full text-left">
      <Card
        title={name}
        icon={<IconCheckSquare size={20} />}
        className={isDone ? 'opacity-90' : ''}
      >
        {description && (
          <p className="text-sm text-text-muted line-clamp-2 mb-2">{description}</p>
        )}
        <div className="flex flex-wrap items-center gap-2">
          {priority && (
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getPriorityTagClass(priority)}`}>
              {priority}
            </span>
          )}
          {due && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-border text-text-muted">
              {due}
            </span>
          )}
        </div>
        {isDone && (
          <span className="inline-block mt-1 text-xs text-green-600 dark:text-green-400">Completed</span>
        )}
      </Card>
    </button>
  )
}

export function KeyResultDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { fetchApi } = useApi()
  const [item, setItem] = useState(null)
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [editingField, setEditingField] = useState(null)
  const [editValue, setEditValue] = useState('')
  const [modalTask, setModalTask] = useState(null)
  const [objectiveName, setObjectiveName] = useState('')

  const refetch = useCallback((silent = false) => {
    if (!silent) {
      setLoading(true)
      setError(null)
    }
    Promise.allSettled([
      fetchApi('/api/key-results').then((r) => (r.data || []).find((kr) => kr.id === id) || null),
      fetchApi('/api/tasks').then((r) => r.data || []),
    ]).then(([krRes, tasksRes]) => {
      if (krRes.status === 'fulfilled' && krRes.value != null) setItem(krRes.value)
      if (tasksRes.status === 'fulfilled') {
        const allTasks = tasksRes.value || []
        setTasks(allTasks.filter((t) => arr(field(t, 'Key Result', 'Key Results')).includes(id)))
      }
    }).finally(() => setLoading(false))
  }, [fetchApi, id])

  useEffect(() => {
    refetch()
  }, [refetch])

  const objectiveLink = item ? arr(field(item, 'Objective Link', 'Objective'))[0] : null
  useEffect(() => {
    if (!objectiveLink) {
      setObjectiveName('')
      return
    }
    setObjectiveName('…')
    fetchApi('/api/objectives')
      .then((r) => {
        const list = r.data || []
        const o = list.find((x) => x.id === objectiveLink)
        setObjectiveName(o ? str(field(o, 'Objective Name', 'Objective Name')) || '(untitled)' : '')
      })
      .catch(() => setObjectiveName(''))
  }, [objectiveLink, fetchApi])

  const handleKrUpdate = useCallback(async (fields) => {
    if (!item) return
    try {
      await fetchApi(`/api/key-results/${item.id}`, {
        method: 'PATCH',
        body: JSON.stringify(fields),
      })
      setItem((prev) => (prev ? { ...prev, ...fields } : null))
      setEditingField(null)
    } catch (e) {
      console.error(e)
    }
    refetch(true)
  }, [fetchApi, item, refetch])

  const handleStatus = useCallback(async (e, newStatus) => {
    e?.stopPropagation?.()
    if (!item) return
    try {
      await fetchApi(`/api/key-results/${item.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ Status: newStatus }),
      })
      setItem((prev) => (prev ? { ...prev, Status: newStatus } : null))
    } catch (err) {
      console.error(err)
    }
    refetch(true)
  }, [fetchApi, item, refetch])

  const handleDelete = useCallback(async () => {
    if (!item) return
    try {
      await fetchApi(`/api/key-results/${item.id}`, { method: 'DELETE' })
      navigate('/key-results')
    } catch (err) {
      console.error(err)
    }
  }, [fetchApi, item, navigate])

  const handleTaskStatusChange = useCallback(async (taskId, status) => {
    try {
      await fetchApi(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        body: JSON.stringify({ Status: status }),
      })
    } catch (err) {
      console.error(err)
    }
    refetch(true)
  }, [fetchApi, refetch])

  const handleTaskUpdate = useCallback(async (taskId, fields) => {
    try {
      await fetchApi(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        body: JSON.stringify(fields),
      })
      refetch(true)
    } catch (err) {
      console.error(err)
    }
  }, [fetchApi, refetch])

  const handleTaskDelete = useCallback(async (taskId) => {
    try {
      await fetchApi(`/api/tasks/${taskId}`, { method: 'DELETE' })
      refetch(true)
      setModalTask((current) => (current?.id === taskId ? null : current))
    } catch (err) {
      console.error(err)
    }
  }, [fetchApi, refetch])

  const taskStats = useMemo(() => {
    const done = tasks.filter((t) => getTaskStatusGroup(t) === 'done').length
    const inProgress = tasks.filter((t) => getTaskStatusGroup(t) === 'in_progress').length
    const pending = tasks.filter((t) => getTaskStatusGroup(t) === 'pending').length
    return { done, inProgress, pending, total: tasks.length }
  }, [tasks])

  const donePct = taskStats.total === 0 ? 0 : Math.round((taskStats.done / taskStats.total) * 100)
  const inProgressPct = taskStats.total === 0 ? 0 : Math.round((taskStats.inProgress / taskStats.total) * 100)
  const pendingPct = taskStats.total === 0 ? 0 : Math.round((taskStats.pending / taskStats.total) * 100)
  const tasksBarTitle = taskStats.total === 0
    ? 'No tasks'
    : `Done: ${donePct}%, In progress: ${inProgressPct}%, To do: ${pendingPct}%`

  if (loading && !item) return <div className="flex justify-center py-12"><Spinner size="lg" /></div>
  if (error && !item) return <p className="text-red-600 dark:text-red-400">{error}</p>
  if (!item) return <p className="text-text-muted">Key Result not found.</p>

  const title = str(field(item, 'Key Result Name', 'Key Result Name')) || 'Key Result'
  const description = str(field(item, 'Description', 'Description')) || ''
  const metric = str(field(item, 'Metric', 'Metric')) || ''
  const currentVal = field(item, 'Current Value', 'Current Value')
  const targetVal = field(item, 'Target Value', 'Target Value')
  const currentStr = currentVal != null && currentVal !== '' ? String(currentVal) : ''
  const targetStr = targetVal != null && targetVal !== '' ? String(targetVal) : ''
  const unit = str(field(item, 'Unit', 'Unit')) || ''
  const deadline = dateStr(field(item, 'Deadline', 'Deadline')) || ''
  const progressVal = num(field(item, 'Progress (%)', 'Progress', 'Progress %'))
  const progressStr = progressVal != null ? String(progressVal) : ''

  const startEdit = (fieldName, currentValue) => {
    setEditingField(fieldName)
    setEditValue(currentValue ?? '')
  }

  const getDue = (t) => dateStr(field(t, 'Due Date', 'Due Date'))

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={[{ label: 'Home', to: '/' }, { label: 'Key Results', to: '/key-results' }, { label: title }]}
        onRefresh={refetch}
        loading={loading}
      />

      {/* Card Key Result */}
      <div className="rounded-2xl border border-2 border-border bg-surface overflow-hidden">
        <div className="p-5 border-b border-border flex flex-col gap-1">
          <div className="flex items-center justify-between gap-3">
            {editingField === 'name' ? (
              <input
                type="text"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={async () => {
                  if (editingField !== 'name') return
                  await handleKrUpdate({ 'Key Result Name': editValue.trim() || title || '(untitled)' })
                  setEditingField(null)
                }}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); e.target.blur() } }}
                className="flex-1 min-w-0 font-bold text-xl text-text bg-surface border border-border rounded-lg px-2 py-1"
                autoFocus
              />
            ) : (
              <h1
                role="button"
                tabIndex={0}
                onClick={() => startEdit('name', title)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); startEdit('name', title) } }}
                className="font-bold text-xl text-text truncate flex-1 min-w-0 cursor-pointer rounded hover:bg-border/50 py-1 -mx-1 px-1 flex items-center gap-2"
              >
                <span className="shrink-0 text-text-muted"><IconTarget size={22} /></span>
                {title || '(untitled)'}
              </h1>
            )}
          </div>
          {objectiveLink && (
            <p className="text-sm text-text-muted">
              <Link to={`/objectives/${objectiveLink}`} className="hover:underline">
                {objectiveName || '…'}
              </Link>
            </p>
          )}
        </div>

        <div className="p-5 space-y-4">
          {editingField === 'description' ? (
            <textarea
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={async () => {
                if (editingField !== 'description') return
                await handleKrUpdate({ Description: editValue })
                setEditingField(null)
              }}
              className="w-full text-sm font-normal text-text bg-surface border border-border rounded-lg px-3 py-2 min-h-[80px] resize-y"
              placeholder="Description"
              autoFocus
            />
          ) : (
            <p
              role="button"
              tabIndex={0}
              onClick={() => startEdit('description', description)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); startEdit('description', description) } }}
              className="text-sm font-normal text-text whitespace-pre-wrap cursor-pointer rounded hover:bg-border/50 py-2 -mx-2 px-2 min-h-[2rem]"
            >
              {description || '(no description)'}
            </p>
          )}

          <hr className="border-border" />

          <div className="space-y-2">
            {/* Metric */}
            <div className="flex items-center gap-2 text-sm">
              <span className="text-text-muted shrink-0"><IconTag size={18} /></span>
              <span className="text-text-muted shrink-0">Metric:</span>
              {editingField === 'metric' ? (
                <input
                  type="text"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onBlur={async () => { if (editingField !== 'metric') return; await handleKrUpdate({ Metric: editValue.trim() }); setEditingField(null) }}
                  onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur() }}
                  className="rounded border border-border bg-surface text-text px-2 py-1 text-sm flex-1 min-w-0"
                  autoFocus
                />
              ) : (
                <span
                  role="button"
                  tabIndex={0}
                  onClick={() => startEdit('metric', metric)}
                  className="text-text cursor-pointer rounded hover:bg-border/50 py-0.5 px-1 flex-1 min-w-0"
                >
                  {metric || '—'}
                </span>
              )}
            </div>

            {/* Current value */}
            <div className="flex items-center gap-2 text-sm">
              <span className="text-text-muted shrink-0"><IconCircle size={18} /></span>
              <span className="text-text-muted shrink-0">Current value:</span>
              {editingField === 'currentValue' ? (
                <input
                  type="text"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onBlur={async () => { if (editingField !== 'currentValue') return; await handleKrUpdate({ 'Current Value': editValue.trim() || null }); setEditingField(null) }}
                  onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur() }}
                  className="rounded border border-border bg-surface text-text px-2 py-1 text-sm flex-1 min-w-0"
                  autoFocus
                />
              ) : (
                <span
                  role="button"
                  tabIndex={0}
                  onClick={() => startEdit('currentValue', currentStr)}
                  className="text-text cursor-pointer rounded hover:bg-border/50 py-0.5 px-1 flex-1 min-w-0"
                >
                  {currentStr || '—'}
                </span>
              )}
            </div>

            {/* Target value */}
            <div className="flex items-center gap-2 text-sm">
              <span className="text-text-muted shrink-0"><IconTarget size={18} /></span>
              <span className="text-text-muted shrink-0">Target value:</span>
              {editingField === 'targetValue' ? (
                <input
                  type="text"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onBlur={async () => { if (editingField !== 'targetValue') return; await handleKrUpdate({ 'Target Value': editValue.trim() || null }); setEditingField(null) }}
                  onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur() }}
                  className="rounded border border-border bg-surface text-text px-2 py-1 text-sm flex-1 min-w-0"
                  autoFocus
                />
              ) : (
                <span
                  role="button"
                  tabIndex={0}
                  onClick={() => startEdit('targetValue', targetStr)}
                  className="text-text cursor-pointer rounded hover:bg-border/50 py-0.5 px-1 flex-1 min-w-0"
                >
                  {targetStr || '—'}
                </span>
              )}
            </div>

            {/* Unit */}
            <div className="flex items-center gap-2 text-sm">
              <span className="text-text-muted shrink-0"><IconTag size={18} /></span>
              <span className="text-text-muted shrink-0">Unit:</span>
              {editingField === 'unit' ? (
                <input
                  type="text"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onBlur={async () => { if (editingField !== 'unit') return; await handleKrUpdate({ Unit: editValue.trim() }); setEditingField(null) }}
                  onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur() }}
                  className="rounded border border-border bg-surface text-text px-2 py-1 text-sm flex-1 min-w-0"
                  autoFocus
                />
              ) : (
                <span
                  role="button"
                  tabIndex={0}
                  onClick={() => startEdit('unit', unit)}
                  className="text-text cursor-pointer rounded hover:bg-border/50 py-0.5 px-1 flex-1 min-w-0"
                >
                  {unit || '—'}
                </span>
              )}
            </div>

            {/* Progress % */}
            <div className="flex items-center gap-2 text-sm">
              <span className="text-text-muted shrink-0"><IconCheckSquare size={18} /></span>
              <span className="text-text-muted shrink-0">Progress (%):</span>
              {editingField === 'progress' ? (
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onBlur={async () => { if (editingField !== 'progress') return; const n = num(editValue); await handleKrUpdate({ 'Progress (%)': n != null ? n : null }); setEditingField(null) }}
                  onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur() }}
                  className="rounded border border-border bg-surface text-text px-2 py-1 text-sm w-20"
                  autoFocus
                />
              ) : (
                <span
                  role="button"
                  tabIndex={0}
                  onClick={() => startEdit('progress', progressStr)}
                  className="text-text cursor-pointer rounded hover:bg-border/50 py-0.5 px-1"
                >
                  {progressStr !== '' ? `${progressStr}%` : '—'}
                </span>
              )}
            </div>

            {/* Deadline */}
            <div className="flex items-center gap-2 text-sm">
              <span className="text-text-muted shrink-0"><IconCalendar size={18} /></span>
              <span className="text-text-muted shrink-0">Deadline:</span>
              {editingField === 'deadline' ? (
                <input
                  type="date"
                  value={editValue}
                  onChange={(e) => { const v = e.target.value; handleKrUpdate({ Deadline: v || null }); setEditingField(null) }}
                  onBlur={() => setEditingField(null)}
                  className="rounded border border-border bg-surface text-text px-2 py-1 text-sm"
                  autoFocus
                />
              ) : (
                <span
                  role="button"
                  tabIndex={0}
                  onClick={() => startEdit('deadline', deadline)}
                  className="text-text cursor-pointer rounded hover:bg-border/50 py-0.5 px-1"
                >
                  {deadline || '—'}
                </span>
              )}
            </div>
          </div>

          <hr className="border-border" />
          <div className="flex items-center justify-between gap-2 w-full flex-wrap">
            <div className="flex flex-wrap gap-2">
              {STATUS_OPTIONS.map(({ value, label }) => {
                const statusGroup = getTaskStatusGroup(item)
                const isActive =
                  (value === 'Done' && statusGroup === 'done') ||
                  (value === 'In Progress' && statusGroup === 'in_progress') ||
                  (value === 'Pending' && statusGroup === 'pending')
                const isPending = value === 'Pending'
                const isInProgress = value === 'In Progress'
                const btnClass = isActive
                  ? isPending
                    ? 'bg-status-pending text-white'
                    : isInProgress
                      ? 'bg-status-in-progress text-white'
                      : 'bg-status-done text-white'
                  : 'bg-border text-text hover:bg-border/80'
                const Icon = isPending ? IconCircle : isInProgress ? IconPlay : IconCheckSquare
                return (
                  <button
                    key={value}
                    type="button"
                    title={label}
                    onClick={(e) => handleStatus(e, value)}
                    className={`min-h-[44px] px-3 md:px-4 rounded-xl text-sm font-medium flex items-center justify-center md:justify-start gap-2 shrink-0 cursor-pointer ${btnClass}`}
                  >
                    <Icon size={18} />
                    <span className="hidden md:inline">{label}</span>
                  </button>
                )
              })}
            </div>
            <button
              type="button"
              onClick={handleDelete}
              title="Delete key result"
              className="min-h-[44px] px-3 rounded-xl flex items-center justify-center shrink-0 bg-transparent text-text-muted hover:bg-red-500/20 hover:text-red-600 dark:hover:text-red-400 transition-colors"
            >
              <IconTrash size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Sección Tasks */}
      <section className="space-y-3">
        <h2 className="text-base font-semibold text-text">Tasks</h2>
        <div className="flex items-center gap-2 w-full">
          <span className="text-sm font-medium text-text-muted shrink-0" title={tasksBarTitle}>
            ({taskStats.total})
          </span>
          <div
            className="flex-1 h-2 rounded-full overflow-hidden flex min-w-0"
            role="progressbar"
            aria-valuenow={donePct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={tasksBarTitle}
            title={tasksBarTitle}
          >
            {taskStats.total === 0 ? (
              <div className="h-full bg-status-pending shrink-0 w-full" />
            ) : (
              <>
                {donePct > 0 && <div className="h-full bg-status-done shrink-0" style={{ width: `${donePct}%` }} />}
                {inProgressPct > 0 && <div className="h-full bg-status-in-progress shrink-0" style={{ width: `${inProgressPct}%` }} />}
                {pendingPct > 0 && <div className="h-full bg-status-pending shrink-0" style={{ width: `${pendingPct}%` }} />}
              </>
            )}
          </div>
          <span className="text-sm font-medium text-text-muted shrink-0">{donePct}%</span>
        </div>

        {tasks.length > 0 ? (
          <CardList
            items={tasks}
            groupBy={getTaskStatusGroup}
            groupOrder={GROUP_ORDER}
            groupLabels={GROUP_LABELS}
            renderItem={(task) => (
              <TaskCardClickable key={task.id} task={task} getDue={getDue} onClick={setModalTask} />
            )}
            initialCollapsed={{ in_progress: false, pending: false, done: true }}
          />
        ) : (
          <p className="text-text-muted">No tasks linked to this key result.</p>
        )}
      </section>

      {modalTask && (
        <TaskModal
          task={tasks.find((t) => t.id === modalTask.id) || modalTask}
          onClose={() => setModalTask(null)}
          onStatusChange={handleTaskStatusChange}
          onTaskUpdate={handleTaskUpdate}
          onTaskDelete={handleTaskDelete}
          refetch={() => refetch(true)}
        />
      )}
    </div>
  )
}
