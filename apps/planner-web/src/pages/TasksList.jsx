import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Spinner,
  PageHeader,
  Card,
  CardList,
  EntityListPage,
  IconCheckSquare,
  IconSearch,
  FilterBar,
  FilterDropdown,
  Fab,
  StatusProgressBar,
} from '@tools/shared'
import { isToday, isThisWeek, isThisMonth, isPastDue } from '@tools/shared'
import { usePlannerApi } from '../contexts/PlannerApiContext'
import { getTaskStatusGroup, getTaskStatusBreakdown } from '../lib/taskStatus'
import { getPriorityTagClass } from '../lib/priorityTagClass'
import { TaskModal } from '../components/TaskModal'

const TASKS_QUERY = `
  query { tasks { id taskName status description dueDate priority lastModified } }
`

const FILTER_OPTIONS = [
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
  { value: 'unplanned', label: 'Unplanned' },
  { value: 'all', label: 'All time' },
]

const GROUP_ORDER = ['in_progress', 'pending', 'done']
const GROUP_LABELS = {
  in_progress: 'In progress',
  pending: 'Pending',
  done: 'Done',
}

function filterByDate(list, filter, getDue) {
  if (filter === 'all') return list
  if (filter === 'unplanned') return list.filter((t) => !getDue(t))
  return list.filter((t) => {
    const due = getDue(t)
    if (!due) return false
    if (filter === 'today') return isToday(due)
    if (filter === 'week') return isThisWeek(due)
    if (filter === 'month') return isThisMonth(due)
    return true
  })
}

function TaskCardClickable({ task, onClick }) {
  const name = (task.taskName || '').trim() || '(untitled)'
  const description = (task.description || '').trim()
  const priority = task.priority || ''
  const due = task.dueDate || ''
  const statusGroup = getTaskStatusGroup(task)
  const isDone = statusGroup === 'done'
  const showPastDueTag = !isDone && due && isPastDue(due)

  return (
    <button type="button" onClick={() => onClick?.(task)} className="block w-full text-left">
      <Card title={name} icon={<IconCheckSquare size={20} />} className={isDone ? 'opacity-90' : ''}>
        {description && <p className="text-sm text-text-muted line-clamp-2 mb-2">{description}</p>}
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
  const { graphql } = usePlannerApi()
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('today')
  const [search, setSearch] = useState('')
  const [modalTask, setModalTask] = useState(null)
  const [createOpen, setCreateOpen] = useState(false)

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

  const getDue = (t) => t.dueDate || ''
  const filteredByDate = useMemo(
    () => filterByDate(tasks, filter, getDue),
    [tasks, filter]
  )
  const filtered = useMemo(() => {
    if (!search.trim()) return filteredByDate
    const q = search.trim().toLowerCase()
    return filteredByDate.filter(
      (t) =>
        (t.taskName || '').toLowerCase().includes(q) ||
        (t.description || '').toLowerCase().includes(q)
    )
  }, [filteredByDate, search])

  const breakdown = useMemo(() => getTaskStatusBreakdown(filtered), [filtered])
  const groupBy = useCallback((t) => getTaskStatusGroup(t), [])

  const handleModalSaved = useCallback(() => {
    load()
  }, [load])

  const filterSummary = FILTER_OPTIONS.find((o) => o.value === filter)?.label ?? 'Dates'

  return (
    <EntityListPage
      header={<PageHeader title="Tasks" onRefresh={load} loading={loading} />}
      filters={
        <div className="space-y-3">
          <div className="relative w-full max-w-md">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none">
              <IconSearch size={18} />
            </span>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tasks…"
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-surface text-text text-sm"
              aria-label="Search tasks"
            />
          </div>
          <FilterBar>
            <FilterDropdown
              label="Dates"
              summary={filterSummary}
              options={FILTER_OPTIONS}
              value={filter}
              onChange={setFilter}
            />
          </FilterBar>
        </div>
      }
      showEmptyState={!loading && filtered.length === 0}
      emptyState={
        <p className="text-text-muted text-center py-8">
          {tasks.length === 0 ? 'No tasks yet. Create one from the planner or add here.' : 'No tasks match the filter.'}
        </p>
      }
    >
      {error && (
        <p className="text-red-600 dark:text-red-400 text-sm mb-4" role="alert">
          {error}
        </p>
      )}
      {!loading && filtered.length > 0 && (
        <div className="mb-4 flex items-center gap-3">
          <span className="text-sm font-medium text-text">Tasks</span>
          <span className="text-sm text-text-muted">{breakdown.total}</span>
          <StatusProgressBar
            segments={breakdown.counts}
            total={breakdown.total}
            ariaLabel="Task progress by status"
            className="max-w-[200px]"
          />
          <span className="text-xs text-text-muted">
            {breakdown.percentages.done}% done
          </span>
        </div>
      )}
      {loading && tasks.length === 0 ? (
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      ) : (
        <CardList
          items={filtered}
          groupBy={groupBy}
          groupOrder={GROUP_ORDER}
          groupLabels={GROUP_LABELS}
          renderItem={(task) => (
            <TaskCardClickable task={task} onClick={setModalTask} />
          )}
        />
      )}
      <Fab onClick={() => setCreateOpen(true)} ariaLabel="Create task" />
      {createOpen && (
        <TaskModal
          task={null}
          onClose={() => setCreateOpen(false)}
          onSaved={handleModalSaved}
        />
      )}
      {modalTask && (
        <TaskModal
          task={modalTask}
          onClose={() => setModalTask(null)}
          onSaved={handleModalSaved}
        />
      )}
    </EntityListPage>
  )
}
