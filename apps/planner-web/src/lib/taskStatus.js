import { getTaskStatusGroup as coreGetTaskStatusGroup, getTaskStatusBreakdown as coreGetTaskStatusBreakdown, getTaskDisplayGroup as coreGetTaskDisplayGroup } from '@tools/shared-planner'
import { graphqlFieldAccessor } from './fieldAccessor.js'

const defaultFieldAccessor = graphqlFieldAccessor()

/**
 * Task status group for GraphQL task records (status, dueDate, etc.).
 */
export function getTaskStatusGroup(task, options = {}) {
  return coreGetTaskStatusGroup(task, {
    fieldAccessor: options.fieldAccessor || defaultFieldAccessor,
  })
}

/**
 * Status breakdown for a list of tasks (counts and percentages).
 */
export function getTaskStatusBreakdown(tasks, options = {}) {
  return coreGetTaskStatusBreakdown(tasks, {
    fieldAccessor: options.fieldAccessor || defaultFieldAccessor,
  })
}

/**
 * Display group for lists: past_due first, then status. Use with isPastDue from @tools/shared.
 */
export function getTaskDisplayGroup(task, dueDateStr, isPastDueFn, options = {}) {
  return coreGetTaskDisplayGroup(task, dueDateStr, isPastDueFn, {
    fieldAccessor: options.fieldAccessor || defaultFieldAccessor,
  })
}
