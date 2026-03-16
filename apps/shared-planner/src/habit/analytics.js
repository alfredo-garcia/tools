import { isHabitSuccess, getHabitIdFromTracking } from './domain.js'

// Computes success percentage for an array of tracking records.
export function computeHabitSuccessPercentage(tracking) {
  const records = Array.isArray(tracking) ? tracking : []
  if (records.length === 0) return 0
  const ok = records.filter((t) => isHabitSuccess(t)).length
  return Math.round((ok / records.length) * 100)
}

// Groups habits by a "Category" field and returns sorted entries [category, habits[]].
export function groupHabitsByCategory(habits, { fieldAccessor } = {}) {
  const getField =
    fieldAccessor ||
    ((t, ...keys) => {
      for (const k of keys) {
        if (t && Object.prototype.hasOwnProperty.call(t, k)) return t[k]
      }
      return undefined
    })

  const map = new Map()
  const list = Array.isArray(habits) ? habits : []
  for (const h of list) {
    const cat = (getField(h, 'Category', 'category') || '').toString()
    if (!map.has(cat)) map.set(cat, [])
    map.get(cat).push(h)
  }
  return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]))
}

// Filters tracking records to only those whose habit id is in the provided set.
export function filterTrackingByHabitIds(tracking, habitIds) {
  const ids = new Set(habitIds || [])
  const records = Array.isArray(tracking) ? tracking : []
  return records.filter((t) => {
    const hid = getHabitIdFromTracking(t)
    return hid && ids.has(hid)
  })
}

