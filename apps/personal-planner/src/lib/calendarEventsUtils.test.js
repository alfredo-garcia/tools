import { describe, it, expect } from 'vitest'
import { getEventsForDay, eventToSlots } from './calendarEventsUtils.js'

describe('calendarEventsUtils', () => {
  describe('getEventsForDay', () => {
    it('returns events that start on the given day', () => {
      const events = [
        { id: '1', start: '2025-03-10T09:00:00', end: '2025-03-10T10:00:00' },
        { id: '2', start: '2025-03-10T14:00:00', end: '2025-03-10T15:00:00' },
        { id: '3', start: '2025-03-11T09:00:00', end: '2025-03-11T10:00:00' },
      ]
      const result = getEventsForDay(events, '2025-03-10')
      expect(result).toHaveLength(2)
      expect(result.map((e) => e.id)).toEqual(['1', '2'])
    })

    it('returns empty array when no events match', () => {
      const events = [{ id: '1', start: '2025-03-11T09:00:00', end: '2025-03-11T10:00:00' }]
      expect(getEventsForDay(events, '2025-03-10')).toEqual([])
    })

    it('handles non-array input', () => {
      expect(getEventsForDay(null, '2025-03-10')).toEqual([])
      expect(getEventsForDay(undefined, '2025-03-10')).toEqual([])
    })
  })

  describe('eventToSlots', () => {
    it('returns [slotIndex, span] for event within 06:00–24:00', () => {
      // 09:00 = slot (9-6)*2 = 6, 10:00 = slot 8, so span 2
      const ev = { start: '2025-03-10T09:00:00', end: '2025-03-10T10:00:00' }
      expect(eventToSlots(ev)).toEqual([6, 2])
    })

    it('clamps start to slot 0 for early morning', () => {
      const ev = { start: '2025-03-10T05:00:00', end: '2025-03-10T06:00:00' }
      const [start, span] = eventToSlots(ev)
      expect(start).toBe(0)
      expect(span).toBeGreaterThanOrEqual(1)
    })

    it('returns at least 1 slot span', () => {
      const ev = { start: '2025-03-10T09:00:00', end: '2025-03-10T09:15:00' }
      const [start, span] = eventToSlots(ev)
      expect(span).toBeGreaterThanOrEqual(1)
    })
  })
})
