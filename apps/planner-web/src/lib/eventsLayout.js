/**
 * Helpers for positioning calendar events in 30-min slots.
 * Supports configurable visible range (startHour–endHour) and multi-column layout for overlapping events.
 */

export function getEventsForDay(events, dayStr) {
  if (!Array.isArray(events)) return []
  return events.filter((ev) => {
    const start = ev.start || ''
    const datePart = start.slice(0, 10)
    return datePart === dayStr
  })
}

/**
 * Get visible slot position for an event within a time range. Returns null if event doesn't overlap the range.
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

function eventsOverlap(a, b) {
  const aStart = new Date(a.start || 0).getTime()
  const aEnd = new Date(a.end || 0).getTime()
  const bStart = new Date(b.start || 0).getTime()
  const bEnd = new Date(b.end || 0).getTime()
  return aStart < bEnd && bStart < aEnd
}

/**
 * For a list of events for one day, assign column layout so overlapping events are shown in multiple columns.
 * Returns array of { event, slotIndex, span, columnIndex, totalColumns }.
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
      overlapping.sort((a, b) => b - a)
      for (const idx of overlapping) {
        merged.push(...groups.splice(idx, 1)[0])
      }
      merged.sort((a, b) => a.slotIndex - b.slotIndex || (a.event.start || '').localeCompare(b.event.start || ''))
      groups.push(merged)
    }
  }

  const result = []
  for (const group of groups) {
    const columnEndTimes = []
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
  return result.sort((a, b) => a.slotIndex - b.slotIndex || (a.event.start || '').localeCompare(b.event.start || ''))
}
