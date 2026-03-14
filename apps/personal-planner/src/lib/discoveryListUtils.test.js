import { describe, it, expect } from 'vitest'
import { STATUS_OPTIONS, getStatusLabel, filterByStatus, filterBySearch } from './discoveryListUtils.js'

describe('discoveryListUtils', () => {
  describe('STATUS_OPTIONS', () => {
    it('includes All statuses, All open, Parking lot, Discovery, Done, Archived', () => {
      const labels = STATUS_OPTIONS.map((o) => o.label)
      expect(labels).toContain('All statuses')
      expect(labels).toContain('All open')
      expect(labels).toContain('Parking lot')
      expect(labels).toContain('Discovery')
      expect(labels).toContain('Done')
      expect(labels).toContain('Archived')
    })

    it('maps Parking lot to New, Discovery to Under Review, Done to Explored', () => {
      expect(STATUS_OPTIONS.find((o) => o.label === 'Parking lot')?.value).toBe('New')
      expect(STATUS_OPTIONS.find((o) => o.label === 'Discovery')?.value).toBe('Under Review')
      expect(STATUS_OPTIONS.find((o) => o.label === 'Done')?.value).toBe('Explored')
    })
  })

  describe('getStatusLabel', () => {
    it('returns label for known status value', () => {
      expect(getStatusLabel('New')).toBe('Parking lot')
      expect(getStatusLabel('Under Review')).toBe('Discovery')
      expect(getStatusLabel('Explored')).toBe('Done')
      expect(getStatusLabel('Archived')).toBe('Archived')
    })

    it('returns value when unknown, and All statuses for empty string', () => {
      expect(getStatusLabel('Other')).toBe('Other')
      expect(getStatusLabel('')).toBe('All statuses')
    })
  })

  describe('filterByStatus', () => {
    const getStatus = (i) => i.status

    it('returns all when statusFilter is empty', () => {
      const list = [
        { id: '1', status: 'New' },
        { id: '2', status: 'Archived' },
      ]
      expect(filterByStatus(list, '', getStatus)).toHaveLength(2)
    })

    it('excludes Archived when statusFilter is _open', () => {
      const list = [
        { id: '1', status: 'New' },
        { id: '2', status: 'Archived' },
        { id: '3', status: 'Under Review' },
      ]
      const result = filterByStatus(list, '_open', getStatus)
      expect(result).toHaveLength(2)
      expect(result.map((i) => i.id)).toEqual(['1', '3'])
    })

    it('returns exact match when statusFilter is a status value', () => {
      const list = [
        { id: '1', status: 'New' },
        { id: '2', status: 'Archived' },
        { id: '3', status: 'New' },
      ]
      const result = filterByStatus(list, 'New', getStatus)
      expect(result).toHaveLength(2)
      expect(result.map((i) => i.id)).toEqual(['1', '3'])
    })

    it('handles empty or null list', () => {
      expect(filterByStatus([], '_open', getStatus)).toEqual([])
      expect(filterByStatus(null, '_open', getStatus)).toEqual(null)
    })
  })

  describe('filterBySearch', () => {
    const getFields = (i) => ({
      name: i.name || '',
      description: i.description || '',
      category: i.category || '',
    })

    it('returns all when searchQuery is empty or whitespace', () => {
      const list = [{ id: '1', name: 'Foo' }]
      expect(filterBySearch(list, '', getFields)).toHaveLength(1)
      expect(filterBySearch(list, '   ', getFields)).toHaveLength(1)
    })

    it('matches by name (case-insensitive)', () => {
      const list = [
        { id: '1', name: 'Learn React' },
        { id: '2', name: 'Other idea' },
      ]
      expect(filterBySearch(list, 'react', getFields)).toHaveLength(1)
      expect(filterBySearch(list, 'learn', getFields)).toHaveLength(1)
      expect(filterBySearch(list, 'other', getFields)).toHaveLength(1)
    })

    it('matches by description and category', () => {
      const list = [
        { id: '1', name: 'A', description: 'Side project', category: '' },
        { id: '2', name: 'B', description: '', category: 'Health' },
      ]
      expect(filterBySearch(list, 'project', getFields)).toHaveLength(1)
      expect(filterBySearch(list, 'health', getFields)).toHaveLength(1)
    })

    it('handles empty list', () => {
      expect(filterBySearch([], 'foo', getFields)).toEqual([])
    })
  })
})
