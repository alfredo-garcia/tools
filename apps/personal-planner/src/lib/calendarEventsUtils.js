/**
 * Pure helpers for positioning calendar events in 30-min slots (06:00–24:00).
 * Used by PlannerPage for the Events section.
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

/** Get [startSlotIndex, spanSlots] from event start/end. Slot 0 = 06:00, 1 = 06:30, ... */
export function eventToSlots(ev) {
  const startStr = ev.start || ''
  const endStr = ev.end || ''
  const startDate = new Date(startStr)
  const endDate = new Date(endStr)
  const startMinutes = startDate.getHours() * 60 + startDate.getMinutes()
  const endMinutes = endDate.getHours() * 60 + endDate.getMinutes()
  const slotStart = Math.max(0, Math.floor((startMinutes - EVENTS_SLOT_START_HOUR * 60) / 30))
  let slotEnd = Math.ceil((endMinutes - EVENTS_SLOT_START_HOUR * 60) / 30)
  if (slotEnd <= slotStart) slotEnd = slotStart + 1
  const EVENTS_SLOTS_COUNT = 36
  slotEnd = Math.min(EVENTS_SLOTS_COUNT, slotEnd)
  return [slotStart, slotEnd - slotStart]
}
