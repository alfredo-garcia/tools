/**
 * Date filter helpers for task due dates.
 * All accept a date string (YYYY-MM-DD) or Date; compare date-only where relevant.
 */

function toDate(d) {
  if (!d) return null
  const x = typeof d === 'string' ? new Date(d) : d
  return Number.isNaN(x.getTime()) ? null : x
}

function toLocalDateStr(d) {
  if (typeof d === 'string' && /^\d{4}-\d{2}-\d{2}/.test(d)) return d.slice(0, 10)
  const x = toDate(d)
  if (!x) return ''
  const y = x.getFullYear()
  const m = String(x.getMonth() + 1).padStart(2, '0')
  const day = String(x.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Due date is today (same calendar day). */
export function isToday(d) {
  const only = toLocalDateStr(d)
  if (!only) return false
  const now = new Date()
  const today = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0')
  return only === today
}

/** Monday 00:00 to Sunday 23:59:59 of current week. */
export function isThisWeek(d) {
  const only = toLocalDateStr(d)
  if (!only) return false
  const [y, m, day] = only.split('-').map(Number)
  const x = new Date(y, m - 1, day)
  const now = new Date()
  const start = new Date(now)
  start.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1))
  start.setHours(0, 0, 0, 0)
  const end = new Date(start)
  end.setDate(end.getDate() + 6)
  end.setHours(23, 59, 59, 999)
  return x >= start && x <= end
}

/** Day 1 to last day of current month. */
export function isThisMonth(d) {
  const only = toLocalDateStr(d)
  if (!only) return false
  const now = new Date()
  const thisYear = now.getFullYear()
  const thisMonth = now.getMonth() + 1
  const lastDay = new Date(thisYear, now.getMonth() + 1, 0).getDate()
  const [y, m, day] = only.split('-').map(Number)
  return y === thisYear && m === thisMonth && day >= 1 && day <= lastDay
}

/** Due date is strictly before today (past due). */
export function isPastDue(d) {
  const only = toLocalDateStr(d)
  if (!only) return false
  const today = new Date()
  const todayStr = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0')
  return only < todayStr
}
