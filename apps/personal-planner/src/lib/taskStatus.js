import { field, str } from '@tools/shared'
import { getTaskStatusGroup as coreGetTaskStatusGroup } from '@tools/shared-planner'

export const STATUS_DONE = ['Done', 'Complete', 'Completado', 'Hecho', 'Cerrado']

export const STATUS_IN_PROGRESS = [
  'In Progress',
  'En progreso',
]

/**
 * Backwards-compatible wrapper around shared-planner's getTaskStatusGroup.
 * Keeps existing semantics for the current Airtable-backed tasks.
 */
export function getTaskStatusGroup(task) {
  return coreGetTaskStatusGroup(task, {
    fieldAccessor: (t, ...keys) => str(field(t, ...keys)),
  })
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
