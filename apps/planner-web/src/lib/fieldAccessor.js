/**
 * Field accessor for GraphQL-shaped records (camelCase).
 * Returns first defined value for the given keys. Use with shared-planner's getTaskStatusGroup, etc.
 * @param {object} obj - Record (e.g. task, objective, habitTracking)
 * @param {...string} keys - Possible field names (e.g. 'status', 'Status', 'dueDate', 'Due Date')
 * @returns {*} First defined value or undefined
 */
export function getField(obj, ...keys) {
  if (!obj) return undefined
  for (const k of keys) {
    if (obj[k] !== undefined && obj[k] !== null) return obj[k]
  }
  return undefined
}

/**
 * Returns a fieldAccessor function suitable for shared-planner (task status, habit domain, etc.).
 * Tries camelCase and display-style keys.
 */
export function graphqlFieldAccessor() {
  return (obj, ...keys) => getField(obj, ...keys)
}

/**
 * Field accessor for habit tracking records (GraphQL: habitId, executionDateTime, wasSuccessful).
 * Use with shared-planner habit domain and analytics.
 */
export function habitTrackingFieldAccessor() {
  return (record, ...keys) => {
    for (const k of keys) {
      if (k === 'Was Successful?' || k === 'Was Successful') return record?.wasSuccessful
      if (k === 'Habit' || k === 'habit') return record?.habitId
      if (k === 'Execution Date-Time' || k === 'Execution Date') return record?.executionDateTime
      if (record && record[k] !== undefined && record[k] !== null) return record[k]
    }
    return undefined
  }
}
