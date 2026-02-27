import { Card, IconCircle, IconPlay, IconCheckSquare } from '@tools/shared'
import { field, str, dateStr, isPastDue } from '@tools/shared'
import { getTaskStatusGroup } from '../lib/taskStatus'

const STATUS_OPTIONS = [
  { value: 'Pending', label: 'Pendiente' },
  { value: 'In Progress', label: 'En progreso' },
  { value: 'Done', label: 'Hecho' },
]

function getPriorityTagClass(priority) {
  const p = (priority || '').toLowerCase()
  if (p === 'low') return 'bg-blue-500/20 text-blue-600 dark:text-blue-400'
  if (p === 'medium') return 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
  if (p === 'high') return 'bg-red-500/20 text-red-600 dark:text-red-400'
  return 'bg-border text-text-muted'
}

/**
 * Card reutilizable para una tarea: título, descripción (2 líneas), tags prioridad/fecha, botones de estado.
 * Props: task, dayStr (opcional; si se pasa, no se muestra due si es el mismo día), onStatusChange(taskId, status), onOpenModal(task), refetch().
 */
export function TaskCard({ task, dayStr, onStatusChange, onOpenModal, refetch }) {
  const name = str(field(task, 'Task Name', 'Task Name')) || '(sin nombre)'
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
    <div className="flex items-center justify-start gap-2 mt-2" onClick={(e) => e.stopPropagation()}>
      {STATUS_OPTIONS.map(({ value }) => {
        const isActive =
          (value === 'Done' && statusGroup === 'done') ||
          (value === 'In Progress' && statusGroup === 'in_progress') ||
          (value === 'Pending' && statusGroup === 'pending')
        const isPending = value === 'Pending'
        const isInProgress = value === 'In Progress'
        const btnClass = isActive
          ? isPending
            ? 'bg-gray-500 text-white'
            : isInProgress
              ? 'bg-blue-500 text-white'
              : 'bg-green-500 text-white'
          : 'bg-border/50 text-text-muted hover:bg-border'
        const Icon = isPending ? IconCircle : isInProgress ? IconPlay : IconCheckSquare
        const title = isPending ? 'Pendiente' : isInProgress ? 'En progreso' : 'Hecho'
        return (
          <button
            key={value}
            type="button"
            onClick={(e) => { e.stopPropagation(); e.preventDefault(); handleStatus(e, value) }}
            title={title}
            className={`w-6 h-6 !min-w-6 !min-h-6 flex items-center justify-center rounded shrink-0 ${btnClass}`}
          >
            <Icon size={10} />
          </button>
        )
      })}
    </div>
  )

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpenModal?.(task)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpenModal?.(task) } }}
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
