/**
 * Date filter helpers: today, this week, this month, past due.
 * Week utilities: getWeekStart, getWeekDays, getWeekdayIndex (0 = Monday, 6 = Sunday).
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

/** Date is today (same calendar day). */
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

/** Date is strictly before today (past due). */
export function isPastDue(d) {
  const only = toLocalDateStr(d)
  if (!only) return false
  const today = new Date()
  const todayStr = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0')
  return only < todayStr
}

/** Date is today or within the next N days (inclusive). */
export function isInNextDays(d, days) {
  const only = toLocalDateStr(d)
  if (!only || days < 0) return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const date = toDate(only)
  if (!date) return false
  date.setHours(0, 0, 0, 0)
  const end = new Date(today)
  end.setDate(end.getDate() + days)
  return date >= today && date <= end
}

/** Today as YYYY-MM-DD. */
export function getTodayStr() {
  const now = new Date()
  return now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0')
}

/** Date is within the last N days (inclusive): from (today - (N-1)) to today. */
export function isInLastDays(d, days) {
  const only = toLocalDateStr(d)
  if (!only || days < 1) return false
  const now = new Date()
  const todayStr = getTodayStr()
  const start = new Date(now)
  start.setDate(now.getDate() - (days - 1))
  start.setHours(0, 0, 0, 0)
  const startStr = start.getFullYear() + '-' + String(start.getMonth() + 1).padStart(2, '0') + '-' + String(start.getDate()).padStart(2, '0')
  return only >= startStr && only <= todayStr
}

/** Date string (YYYY-MM-DD) for N days ago (0 = today). */
export function getDaysAgoStr(days) {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0')
}

/** Monday 00:00 of the week containing the given date. */
export function getWeekStart(d) {
  const x = d ? (typeof d === 'string' ? new Date(d) : new Date(d.getTime())) : new Date()
  const day = x.getDay()
  const diff = x.getDate() - (day === 0 ? 6 : day - 1)
  x.setDate(diff)
  x.setHours(0, 0, 0, 0)
  return x
}

/** Array of 7 date strings (YYYY-MM-DD) for the current week, Monday first. */
export function getWeekDays(d) {
  const start = getWeekStart(d || new Date())
  const out = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    out.push(`${y}-${m}-${day}`)
  }
  return out
}

/** Day-of-week index 0–6 for a date string (0 = Monday, 6 = Sunday). */
export function getWeekdayIndex(dateStr) {
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}/.test(dateStr)) return -1
  const [y, m, day] = dateStr.slice(0, 10).split('-').map(Number)
  const d = new Date(y, m - 1, day)
  const dayOfWeek = d.getDay()
  return dayOfWeek === 0 ? 6 : dayOfWeek - 1
}
