import { describe, it, expect } from 'vitest'
import { getResourcePrefix } from './offlineStore.js'

describe('offlineStore', () => {
  describe('getResourcePrefix', () => {
    it('returns collection path for resource path with id', () => {
      expect(getResourcePrefix('/api/tasks/recXXX')).toBe('/api/tasks')
      expect(getResourcePrefix('/api/objectives/rec123')).toBe('/api/objectives')
      expect(getResourcePrefix('api/habits/rec456')).toBe('/api/habits')
    })

    it('returns same path for collection path', () => {
      expect(getResourcePrefix('/api/tasks')).toBe('/api/tasks')
      expect(getResourcePrefix('/api/objectives')).toBe('/api/objectives')
    })

    it('strips query string', () => {
      expect(getResourcePrefix('/api/tasks?foo=1')).toBe('/api/tasks')
      expect(getResourcePrefix('/api/tasks/recX?bar=2')).toBe('/api/tasks')
    })

    it('handles empty or falsy', () => {
      expect(getResourcePrefix('')).toBe('/')
      expect(getResourcePrefix(null)).toBe('/')
    })
  })
})
