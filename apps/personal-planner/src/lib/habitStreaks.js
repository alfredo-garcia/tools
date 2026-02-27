import { field, dateStr } from '@tools/shared'

function toLocalDateStr(d) {
  if (typeof d === 'string' && /^\d{4}-\d{2}-\d{2}/.test(d)) return d.slice(0, 10)
  const x = new Date(d)
  if (Number.isNaN(x.getTime())) return ''
  const y = x.getFullYear()
  const m = String(x.getMonth() + 1).padStart(2, '0')
  const day = String(x.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function isSuccess(record) {
  const v = field(record, 'Was Successful?', 'Was Successful')
  return v === true || String(v).toLowerCase() === 'yes' || v === '1'
}

/**
 * Get tracking records for a habit, normalized to successful dates only (one set of dates per habit).
 * @param {string} habitId
 * @param {object[]} tracking - habit-tracking records
 * @returns {string[]} sorted YYYY-MM-DD dates with at least one successful log for this habit
 */
function getSuccessfulDatesForHabit(habitId, tracking) {
  const linkField = (t) => {
    const link = field(t, 'Habit', 'Habit')
    return Array.isArray(link) ? link : link != null ? [link] : []
  }
  const dates = new Set()
  tracking.forEach((t) => {
    if (!linkField(t).includes(habitId)) return
    const d = dateStr(field(t, 'Execution Date-Time', 'Execution Date-Time', 'Execution Date'))
    if (!d) return
    const dateOnly = toLocalDateStr(d)
    if (!dateOnly) return
    if (isSuccess(t)) dates.add(dateOnly)
  })
  return Array.from(dates).sort()
}

/**
 * Current streak: consecutive days up to and including today with at least one successful log.
 * @param {string} habitId
 * @param {object[]} tracking
 * @returns {number}
 */
export function getCurrentStreak(habitId, tracking) {
  const dates = getSuccessfulDatesForHabit(habitId, tracking)
  if (dates.length === 0) return 0
  const today = new Date()
  const todayStr =
    today.getFullYear() +
    '-' +
    String(today.getMonth() + 1).padStart(2, '0') +
    '-' +
    String(today.getDate()).padStart(2, '0')
  if (!dates.includes(todayStr)) return 0
  let count = 0
  let d = new Date(today)
  const check = () => {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  }
  while (dates.includes(check())) {
    count++
    d.setDate(d.getDate() - 1)
  }
  return count
}

/**
 * Longest streak: max consecutive days with at least one successful log (in the past).
 * @param {string} habitId
 * @param {object[]} tracking
 * @returns {number}
 */
export function getLongestStreak(habitId, tracking) {
  const dates = getSuccessfulDatesForHabit(habitId, tracking)
  if (dates.length === 0) return 0
  let max = 1
  let current = 1
  for (let i = 1; i < dates.length; i++) {
    const prev = new Date(dates[i - 1])
    const curr = new Date(dates[i])
    const diffDays = Math.round((curr - prev) / (24 * 60 * 60 * 1000))
    if (diffDays === 1) {
      current++
      max = Math.max(max, current)
    } else {
      current = 1
    }
  }
  return max
}
