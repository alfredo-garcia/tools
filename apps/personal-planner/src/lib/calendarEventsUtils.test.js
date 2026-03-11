import { describe, it, expect } from 'vitest'
import { getEventsForDay, eventToSlots, eventToVisibleSlots, getEventsVisibility, getEventsWithColumnLayout } from './calendarEventsUtils.js'

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

  describe('eventToVisibleSlots', () => {
    it('returns { slotIndex, span } for event within range 7–19', () => {
      const ev = { start: '2025-03-10T09:00:00', end: '2025-03-10T10:00:00' }
      expect(eventToVisibleSlots(ev, 7, 19)).toEqual({ slotIndex: 4, span: 2 })
    })

    it('returns null when event is entirely before range', () => {
      const ev = { start: '2025-03-10T05:00:00', end: '2025-03-10T06:00:00' }
      expect(eventToVisibleSlots(ev, 7, 19)).toBeNull()
    })

    it('returns null when event is entirely after range', () => {
      const ev = { start: '2025-03-10T20:00:00', end: '2025-03-10T21:00:00' }
      expect(eventToVisibleSlots(ev, 7, 19)).toBeNull()
    })

    it('clips event that starts before range', () => {
      const ev = { start: '2025-03-10T06:00:00', end: '2025-03-10T08:00:00' }
      expect(eventToVisibleSlots(ev, 7, 19)).toEqual({ slotIndex: 0, span: 2 })
    })

    it('clips event that ends after range', () => {
      const ev = { start: '2025-03-10T18:00:00', end: '2025-03-10T21:00:00' }
      expect(eventToVisibleSlots(ev, 7, 19)).toEqual({ slotIndex: 22, span: 2 })
    })
  })

  describe('getEventsVisibility', () => {
    it('returns hasEventsBefore when an event starts before range', () => {
      const events = [
        { id: '1', start: '2025-03-10T06:00:00', end: '2025-03-10T07:30:00' },
      ]
      expect(getEventsVisibility(events, '2025-03-10', 7, 19)).toEqual({ hasEventsBefore: true, hasEventsAfter: false })
    })

    it('returns hasEventsAfter when an event ends after range', () => {
      const events = [
        { id: '1', start: '2025-03-10T18:00:00', end: '2025-03-10T20:00:00' },
      ]
      expect(getEventsVisibility(events, '2025-03-10', 7, 19)).toEqual({ hasEventsBefore: false, hasEventsAfter: true })
    })

    it('returns both when events span outside range', () => {
      const events = [
        { id: '1', start: '2025-03-10T06:00:00', end: '2025-03-10T08:00:00' },
        { id: '2', start: '2025-03-10T18:00:00', end: '2025-03-10T21:00:00' },
      ]
      expect(getEventsVisibility(events, '2025-03-10', 7, 19)).toEqual({ hasEventsBefore: true, hasEventsAfter: true })
    })

    it('returns neither when all events are inside range', () => {
      const events = [
        { id: '1', start: '2025-03-10T09:00:00', end: '2025-03-10T10:00:00' },
      ]
      expect(getEventsVisibility(events, '2025-03-10', 7, 19)).toEqual({ hasEventsBefore: false, hasEventsAfter: false })
    })
  })

  describe('getEventsWithColumnLayout', () => {
    it('returns single event with totalColumns 1 (full width)', () => {
      const events = [{ id: '1', start: '2025-03-10T09:00:00', end: '2025-03-10T10:00:00' }]
      const result = getEventsWithColumnLayout(events, '2025-03-10', 7, 19)
      expect(result).toHaveLength(1)
      expect(result[0].columnIndex).toBe(0)
      expect(result[0].totalColumns).toBe(1)
      expect(result[0].slotIndex).toBe(4)
      expect(result[0].span).toBe(2)
    })

    it('assigns two columns when two events overlap', () => {
      const events = [
        { id: '1', start: '2025-03-10T09:00:00', end: '2025-03-10T10:00:00' },
        { id: '2', start: '2025-03-10T09:30:00', end: '2025-03-10T10:30:00' },
      ]
      const result = getEventsWithColumnLayout(events, '2025-03-10', 7, 19)
      expect(result).toHaveLength(2)
      expect(result[0].totalColumns).toBe(2)
      expect(result[0].columnIndex).toBe(0)
      expect(result[1].totalColumns).toBe(2)
      expect(result[1].columnIndex).toBe(1)
    })

    it('assigns three columns when three events overlap', () => {
      const events = [
        { id: '1', start: '2025-03-10T09:00:00', end: '2025-03-10T10:00:00' },
        { id: '2', start: '2025-03-10T09:30:00', end: '2025-03-10T10:30:00' },
        { id: '3', start: '2025-03-10T09:45:00', end: '2025-03-10T10:45:00' },
      ]
      const result = getEventsWithColumnLayout(events, '2025-03-10', 7, 19)
      expect(result).toHaveLength(3)
      expect(result.every((r) => r.totalColumns === 3)).toBe(true)
      expect(result.map((r) => r.columnIndex).sort()).toEqual([0, 1, 2])
    })

    it('keeps non-overlapping events in separate groups (each totalColumns 1)', () => {
      const events = [
        { id: '1', start: '2025-03-10T09:00:00', end: '2025-03-10T10:00:00' },
        { id: '2', start: '2025-03-10T14:00:00', end: '2025-03-10T15:00:00' },
      ]
      const result = getEventsWithColumnLayout(events, '2025-03-10', 7, 19)
      expect(result).toHaveLength(2)
      expect(result[0].totalColumns).toBe(1)
      expect(result[0].columnIndex).toBe(0)
      expect(result[1].totalColumns).toBe(1)
      expect(result[1].columnIndex).toBe(0)
    })
  })
})
