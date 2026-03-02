import { Card, IconCircle, IconPlay, IconCheckSquare } from '@tools/shared'
import { field, str, dateStr, isPastDue } from '@tools/shared'
import { getTaskStatusGroup } from '../lib/taskStatus'

const STATUS_OPTIONS = [
  { value: 'Pending', label: 'To do' },
  { value: 'In Progress', label: 'In progress' },
  { value: 'Done', label: 'Done' },
]

export function getPriorityTagClass(priority) {
  const p = (priority || '').toLowerCase()
  if (p === 'low') return 'bg-blue-500/20 text-blue-600 dark:text-blue-400'
  if (p === 'medium') return 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
  if (p === 'high') return 'bg-red-500/20 text-red-600 dark:text-red-400'
  return 'bg-border text-text-muted'
}

/**
 * Reusable task card: title, 2-line description, priority/due tags, status buttons.
 * Props: task, dayStr (optional), onStatusChange(taskId, status), onOpenModal(task), refetch(), isDragging (optional, skip opening modal when true).
 */
export function TaskCard({ task, dayStr, onStatusChange, onOpenModal, refetch, isDragging }) {
  const name = str(field(task, 'Task Name', 'Task Name')) || '(untitled)'
  const statusGroup = getTaskStatusGroup(task)
  const priority = str(field(task, 'Priority', 'Priority'))
  const dueStr = dateStr(field(task, 'Due Date', 'Due Date'))
  const description = str(field(task, 'Description', 'Description'))
  const showDueTag = dueStr && (dayStr === undefined || dueStr !== dayStr)
  const dueIsPast = showDueTag && isPastDue(dueStr)

  const handleStatus = async (e, newStatus) => {
    e.stopPropagation()
    e.preventDefault()
    try {
      await onStatusChange(task.id, newStatus)
      refetch?.()
    } catch (err) {
      console.error(err)
    }
  }

  const tags = (
    <div className="flex flex-wrap items-center gap-1.5 mt-1">
      {priority && (
        <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium ${getPriorityTagClass(priority)}`}>
          {priority}
        </span>
      )}
      {showDueTag && (
        <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium ${dueIsPast ? 'bg-red-500/20 text-red-600 dark:text-red-400' : 'bg-border text-text-muted'}`}>
          {dueStr}
        </span>
      )}
    </div>
  )

  const statusButtons = (
    <div className="flex w-full items-center gap-1 mt-2" onClick={(e) => e.stopPropagation()}>
      {STATUS_OPTIONS.map(({ value, label }) => {
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
          : 'bg-border/50 text-text-muted hover:bg-border'
        const Icon = isPending ? IconCircle : isInProgress ? IconPlay : IconCheckSquare
        return (
          <button
            key={value}
            type="button"
            onClick={(e) => { e.stopPropagation(); e.preventDefault(); handleStatus(e, value) }}
            title={label}
            className={`flex-1 min-w-0 flex items-center justify-center gap-0.5 py-1 px-1 rounded text-[10px] font-medium truncate ${btnClass}`}
          >
            <Icon size={10} className="shrink-0" />
            <span className="truncate">{label}</span>
          </button>
        )
      })}
    </div>
  )

  const handleOpenModal = () => {
    if (isDragging) return
    onOpenModal?.(task)
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleOpenModal}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleOpenModal() } }}
      className="w-full cursor-pointer"
    >
      <Card
        title={name}
        expandable={false}
        buttons={statusButtons}
        className="w-full"
      >
        {description && (
          <div className="text-xs text-text-muted line-clamp-2 break-words">
            {description}
          </div>
        )}
        {tags}
      </Card>
    </div>
  )
}

export { STATUS_OPTIONS }
