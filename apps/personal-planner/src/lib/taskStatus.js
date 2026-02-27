import { field, str } from '@tools/shared'

export const STATUS_DONE = ['Done', 'Complete', 'Completado', 'Hecho', 'Cerrado']

export const STATUS_IN_PROGRESS = [
  'In Progress',
  'En progreso',
]

const DONE_SET = new Set(STATUS_DONE.map((s) => s.toLowerCase()))
const IN_PROGRESS_SET = new Set(STATUS_IN_PROGRESS.map((s) => s.toLowerCase()))

/**
 * @param {object} task - Task object with Status field
 * @returns {'done' | 'in_progress' | 'pending'}
 */
export function getTaskStatusGroup(task) {
  const status = str(field(task, 'Status', 'Status'))
  const lower = status.toLowerCase()
  if (DONE_SET.has(lower)) return 'done'
  if (IN_PROGRESS_SET.has(lower)) return 'in_progress'
  return 'pending'
}

/**
 * Display group for lists: past_due first (due date in past and not done), then status.
 * @param {object} task - Task object
 * @param {string} dueDateStr - Due date as YYYY-MM-DD (from dateStr(field(task, 'Due Date', ...)))
 * @param {function} isPastDueFn - (dateStr) => boolean
 * @returns {'past_due' | 'in_progress' | 'pending' | 'done'}
 */
export function getTaskDisplayGroup(task, dueDateStr, isPastDueFn) {
  const statusGroup = getTaskStatusGroup(task)
  if (statusGroup === 'done') return 'done'
  if (dueDateStr && isPastDueFn(dueDateStr)) return 'past_due'
  return statusGroup
}
