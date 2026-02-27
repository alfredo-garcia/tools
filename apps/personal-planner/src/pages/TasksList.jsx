import { useState, useEffect, useCallback } from 'react'
import { useApi, Spinner, PageHeader, Card, CardList, IconCheckSquare } from '@tools/shared'
import { field, str, dateStr, isToday, isThisWeek, isThisMonth, isPastDue } from '@tools/shared'
import { getTaskStatusGroup } from '../lib/taskStatus'
import { getPriorityTagClass } from '../components/TaskCard'
import { TaskModal } from '../components/TaskModal'
import { Fab } from '../components/Fab'

const FILTER_OPTIONS = [
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
  { value: 'all', label: 'All' },
]

const GROUP_ORDER = ['in_progress', 'pending', 'done']
const GROUP_LABELS = {
  in_progress: 'In progress',
  pending: 'Pending',
  done: 'Done',
}

function filterByDate(list, filter, getDue) {
  if (filter === 'all') return list
  return list.filter((t) => {
    const due = getDue(t)
    if (filter === 'today') return isToday(due)
    if (filter === 'week') return isThisWeek(due)
    if (filter === 'month') return isThisMonth(due)
    return true
  })
}

function TaskCardClickable({ task, getDue, onClick }) {
  const name = str(field(task, 'Task Name', 'Task Name')) || '(untitled)'
  const description = str(field(task, 'Description', 'Description')) || ''
  const priority = str(field(task, 'Priority', 'Priority'))
  const due = getDue(task)
  const statusGroup = getTaskStatusGroup(task)
  const isDone = statusGroup === 'done'
  const showPastDueTag = !isDone && due && isPastDue(due)

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
          {showPastDueTag && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-500/20 text-red-600 dark:text-red-400">
              Past due: {due}
            </span>
          )}
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

export function TasksList() {
  const { fetchApi } = useApi()
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('today')
  const [modalTask, setModalTask] = useState(null)
  const [createTaskOpen, setCreateTaskOpen] = useState(false)

  const refetch = useCallback(() => {
    setLoading(true)
    setError(null)
    fetchApi('/api/tasks')
      .then((r) => setList(r.data || []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [fetchApi])

  useEffect(() => {
    refetch()
  }, [refetch])

  const handleTaskStatusChange = useCallback(async (taskId, status) => {
    try {
      await fetchApi(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        body: JSON.stringify({ Status: status }),
      })
    } catch (err) {
      console.error(err)
    }
    refetch()
  }, [fetchApi, refetch])

  const handleTaskUpdate = useCallback(async (taskId, fields) => {
    try {
      await fetchApi(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        body: JSON.stringify(fields),
      })
      refetch()
    } catch (err) {
      console.error(err)
    }
  }, [fetchApi, refetch])

  const handleTaskDelete = useCallback(async (taskId) => {
    try {
      await fetchApi(`/api/tasks/${taskId}`, { method: 'DELETE' })
      refetch()
      setModalTask((current) => (current?.id === taskId ? null : current))
    } catch (err) {
      console.error(err)
    }
  }, [fetchApi, refetch])

  const handleCreateTask = useCallback(
    async (fields) => {
      await fetchApi('/api/tasks', { method: 'POST', body: JSON.stringify(fields) })
      refetch()
    },
    [fetchApi, refetch]
  )

  const getDue = (t) => dateStr(field(t, 'Due Date', 'Due Date'))
  const filteredByDate = filterByDate(list, filter, getDue)
  const pastDueFromFull = list.filter((t) => {
    const due = getDue(t)
    return due && isPastDue(due) && getTaskStatusGroup(t) !== 'done'
  })
  const filteredIds = new Set(filteredByDate.map((t) => t.id))
  const filtered = [...filteredByDate]
  pastDueFromFull.forEach((t) => {
    if (!filteredIds.has(t.id)) {
      filtered.push(t)
      filteredIds.add(t.id)
    }
  })

  const groupBy = getTaskStatusGroup
  const initialCollapsed = { in_progress: false, pending: false, done: true }

  const groups = GROUP_ORDER.reduce((acc, key) => {
    acc[key] = filtered.filter((t) => groupBy(t) === key)
    return acc
  }, {})
  const doneCount = groups.done.length
  const inProgressCount = groups.in_progress.length
  const pendingCount = groups.pending.length
  const total = filtered.length
  const completionPct = total === 0 ? 0 : Math.round((doneCount / total) * 100)
  const inProgressPct = total === 0 ? 0 : Math.round((inProgressCount / total) * 100)
  const pendingPct = total === 0 ? 0 : Math.round((pendingCount / total) * 100)
  const progressBarTitle = total === 0
    ? 'No tasks'
    : `Done: ${completionPct}%, In progress: ${inProgressPct}%, To do: ${pendingPct}%`

  const renderItem = (task) => (
    <TaskCardClickable key={task.id} task={task} getDue={getDue} onClick={setModalTask} />
  )

  if (loading && list.length === 0) return <div className="flex justify-center py-12"><Spinner size="lg" /></div>
  if (error && list.length === 0) return <p className="text-red-600 dark:text-red-400">{error}</p>

  return (
    <div className="space-y-6">
      <PageHeader breadcrumbs={[{ label: 'Home', to: '/' }, { label: 'Tasks', to: '/tasks' }]} onRefresh={refetch} loading={loading} />
      <div className="flex flex-wrap gap-2">
        {FILTER_OPTIONS.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            onClick={() => setFilter(value)}
            className={`min-h-[44px] px-4 py-2 rounded-xl text-base font-medium ${
              filter === value
                ? 'bg-primary text-white'
                : 'bg-surface border-2 border-border text-text'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-text">Tasks</h2>
        <div className="flex items-center gap-2 w-full">
          <span className="text-sm font-medium text-text-muted shrink-0" title={progressBarTitle}>
            ({total})
          </span>
          <div
            className="flex-1 h-2 rounded-full overflow-hidden flex min-w-0"
            role="progressbar"
            aria-valuenow={completionPct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={progressBarTitle}
            title={progressBarTitle}
          >
            {total === 0 ? (
              <div className="h-full bg-status-pending shrink-0 w-full" />
            ) : (
              <>
                {completionPct > 0 && <div className="h-full bg-status-done shrink-0" style={{ width: `${completionPct}%` }} />}
                {inProgressPct > 0 && <div className="h-full bg-status-in-progress shrink-0" style={{ width: `${inProgressPct}%` }} />}
                {pendingPct > 0 && <div className="h-full bg-status-pending shrink-0" style={{ width: `${pendingPct}%` }} />}
              </>
            )}
          </div>
          <span className="text-sm font-medium text-text-muted shrink-0">{completionPct}%</span>
        </div>
      </section>

      <CardList
        items={filtered}
        groupBy={groupBy}
        groupOrder={GROUP_ORDER}
        groupLabels={GROUP_LABELS}
        renderItem={renderItem}
        initialCollapsed={initialCollapsed}
      />

      {filtered.length === 0 && (
        <p className="text-text-muted">No tasks for this filter.</p>
      )}

      {modalTask && (
        <TaskModal
          task={list.find((t) => t.id === modalTask.id) || modalTask}
          onClose={() => setModalTask(null)}
          onStatusChange={handleTaskStatusChange}
          onTaskUpdate={handleTaskUpdate}
          onTaskDelete={handleTaskDelete}
          refetch={refetch}
        />
      )}

      {createTaskOpen && (
        <TaskModal
          task={null}
          onClose={() => setCreateTaskOpen(false)}
          onCreate={handleCreateTask}
          refetch={refetch}
        />
      )}

      <Fab onClick={() => setCreateTaskOpen(true)} ariaLabel="Create task" />
    </div>
  )
}
