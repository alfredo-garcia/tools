import { field, str } from './normalize.js'

export const STATUS_DONE = ['Done', 'Complete', 'Completado', 'Hecho', 'Cerrado']

export const STATUS_IN_PROGRESS = [
  'In Progress',
  'En progreso',
  'In progress',
  'En Progreso',
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
