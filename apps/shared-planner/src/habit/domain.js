// Habit domain helpers shared by the planner web app.

// Returns true if a habit tracking record is successful.
export function isHabitSuccess(record, { fieldAccessor } = {}) {
  const getField =
    fieldAccessor ||
    ((t, ...keys) => {
      for (const k of keys) {
        if (t && Object.prototype.hasOwnProperty.call(t, k)) return t[k]
      }
      return undefined
    })

  const v = getField(record, 'Was Successful?', 'Was Successful')
  if (v === true) return true
  const s = String(v).trim().toLowerCase()
  return s === 'yes' || s === '1' || s === 'true'
}

// Extracts the habit id from a tracking record (Airtable link field semantics).
export function getHabitIdFromTracking(record, { fieldAccessor } = {}) {
  const getField =
    fieldAccessor ||
    ((t, ...keys) => {
      for (const k of keys) {
        if (t && Object.prototype.hasOwnProperty.call(t, k)) return t[k]
      }
      return undefined
    })

  const link = getField(record, 'Habit', 'habit')
  const arr = Array.isArray(link) ? link : link != null ? [link] : []
  return arr[0] || null
}

