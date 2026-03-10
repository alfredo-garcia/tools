import { describe, it, expect } from 'vitest'
import { isConflict } from '../../api/_lib/airtable.js'

describe('airtable isConflict', () => {
  it('returns false when clientLastModified is missing', () => {
    expect(isConflict('2025-03-10T12:00:00.000Z', undefined)).toBe(false)
    expect(isConflict('2025-03-10T12:00:00.000Z', null)).toBe(false)
  })

  it('returns false when serverLastModified is missing', () => {
    expect(isConflict(undefined, '2025-03-10T11:00:00.000Z')).toBe(false)
    expect(isConflict(null, '2025-03-10T11:00:00.000Z')).toBe(false)
  })

  it('returns true when server is newer than client', () => {
    expect(isConflict('2025-03-10T12:00:00.000Z', '2025-03-10T11:00:00.000Z')).toBe(true)
    expect(isConflict('2025-03-11T00:00:00.000Z', '2025-03-10T23:59:59.000Z')).toBe(true)
  })

  it('returns false when client is same or newer than server', () => {
    expect(isConflict('2025-03-10T12:00:00.000Z', '2025-03-10T12:00:00.000Z')).toBe(false)
    expect(isConflict('2025-03-10T11:00:00.000Z', '2025-03-10T12:00:00.000Z')).toBe(false)
    expect(isConflict('2025-03-10T11:00:00.000Z', '2025-03-11T00:00:00.000Z')).toBe(false)
  })
})
