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

/** Check if two events overlap in time (start/end are ISO strings or date-like). */
function eventsOverlap(a, b) {
  const aStart = new Date(a.start || 0).getTime()
  const aEnd = new Date(a.end || 0).getTime()
  const bStart = new Date(b.start || 0).getTime()
  const bEnd = new Date(b.end || 0).getTime()
  return aStart < bEnd && bStart < aEnd
}

/**
 * For a list of events for one day (visible in startHour–endHour), assign column layout so overlapping
 * events are shown in 2 or more columns. Returns array of { event, slotIndex, span, columnIndex, totalColumns }.
 * Non-overlapping events get totalColumns 1 (full width).
 */
export function getEventsWithColumnLayout(events, dayStr, startHour, endHour) {
  const forDay = getEventsForDay(events, dayStr)
  const withSlots = []
  for (const ev of forDay) {
    const visible = eventToVisibleSlots(ev, startHour, endHour)
    if (!visible) continue
    withSlots.push({ event: ev, slotIndex: visible.slotIndex, span: visible.span })
  }
  if (withSlots.length === 0) return []

  // Build overlapping groups (transitive): two events in same group if they overlap (directly or via others).
  const groups = []
  for (const item of withSlots) {
    const ev = item.event
    const overlapping = []
    for (let i = 0; i < groups.length; i++) {
      const hasOverlap = groups[i].some((x) => eventsOverlap(x.event, ev))
      if (hasOverlap) overlapping.push(i)
    }
    if (overlapping.length === 0) {
      groups.push([item])
    } else {
      const merged = [item]
      overlapping.sort((a, b) => b - a) // splice from high index first so indices stay valid
      for (const idx of overlapping) {
        merged.push(...groups.splice(idx, 1)[0])
      }
      merged.sort((a, b) => a.slotIndex - b.slotIndex || a.event.start.localeCompare(b.event.start))
      groups.push(merged)
    }
  }

  // Within each group, assign columnIndex greedily by start time (first free column).
  const result = []
  for (const group of groups) {
    const columnEndTimes = [] // columnEndTimes[i] = end time (ms) of last event in column i
    const groupResults = []
    for (const item of group) {
      const ev = item.event
      const startMs = new Date(ev.start || 0).getTime()
      const endMs = new Date(ev.end || 0).getTime()
      let col = 0
      while (col < columnEndTimes.length && columnEndTimes[col] > startMs) col++
      if (col === columnEndTimes.length) columnEndTimes.push(0)
      columnEndTimes[col] = endMs
      groupResults.push({ ...item, columnIndex: col })
    }
    const totalColumns = columnEndTimes.length
    for (const r of groupResults) {
      result.push({ ...r, totalColumns })
    }
  }
  return result.sort((a, b) => a.slotIndex - b.slotIndex || a.event.start.localeCompare(b.event.start))
}
