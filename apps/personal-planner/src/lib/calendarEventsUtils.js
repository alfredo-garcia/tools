/**
 * Pure helpers for positioning calendar events in 30-min slots.
 * Used by PlannerPage for the Events section. Supports configurable visible range (startHour–endHour).
 */

/** Calendar events: filter by day (start date in local date string YYYY-MM-DD). */
export function getEventsForDay(events, dayStr) {
  if (!Array.isArray(events)) return []
  return events.filter((ev) => {
    const start = ev.start || ''
    const datePart = start.slice(0, 10)
    return datePart === dayStr
  })
}

const EVENTS_SLOT_START_HOUR = 6
const EVENTS_SLOTS_COUNT = 36

/** Get [startSlotIndex, spanSlots] from event start/end. Slot 0 = 06:00, 1 = 06:30, ... (legacy 06:00–24:00). */
export function eventToSlots(ev) {
  const r = eventToVisibleSlots(ev, EVENTS_SLOT_START_HOUR, 24)
  if (!r) return [0, 1]
  return [r.slotIndex, r.span]
}

/**
 * Get visible slot position for an event within a time range. Returns null if event doesn't overlap the range.
 * @param {object} ev - Event with start/end ISO strings
 * @param {number} startHour - Visible range start (e.g. 7)
 * @param {number} endHour - Visible range end (e.g. 19)
 * @returns {{ slotIndex: number, span: number } | null}
 */
export function eventToVisibleSlots(ev, startHour, endHour) {
  const startStr = ev.start || ''
  const endStr = ev.end || ''
  const startDate = new Date(startStr)
  const endDate = new Date(endStr)
  const startMinutes = startDate.getHours() * 60 + startDate.getMinutes()
  const endMinutes = endDate.getHours() * 60 + endDate.getMinutes()
  const rangeStart = startHour * 60
  const rangeEnd = endHour * 60
  if (endMinutes <= rangeStart || startMinutes >= rangeEnd) return null
  const visibleStart = Math.max(startMinutes, rangeStart)
  const visibleEnd = Math.min(endMinutes, rangeEnd)
  const slotIndex = Math.floor((visibleStart - rangeStart) / 30)
  let span = Math.ceil((visibleEnd - visibleStart) / 30)
  if (span < 1) span = 1
  return { slotIndex, span }
}

/**
 * For a given day, detect if any events start before or end after the visible range (to show top/bottom indicators).
 * @param {object[]} events - All events
 * @param {string} dayStr - YYYY-MM-DD
 * @param {number} startHour - Visible range start
 * @param {number} endHour - Visible range end
 * @returns {{ hasEventsBefore: boolean, hasEventsAfter: boolean }}
 */
export function getEventsVisibility(events, dayStr, startHour, endHour) {
  const forDay = getEventsForDay(events, dayStr)
  const rangeStart = startHour * 60
  const rangeEnd = endHour * 60
  let hasEventsBefore = false
  let hasEventsAfter = false
  for (const ev of forDay) {
    const startStr = ev.start || ''
    const endStr = ev.end || ''
    const startDate = new Date(startStr)
    const endDate = new Date(endStr)
    const startMinutes = startDate.getHours() * 60 + startDate.getMinutes()
    const endMinutes = endDate.getHours() * 60 + endDate.getMinutes()
    if (startMinutes < rangeStart) hasEventsBefore = true
    if (endMinutes > rangeEnd) hasEventsAfter = true
  }
  return { hasEventsBefore, hasEventsAfter }
}
