import { describe, it } from 'node:test'
import assert from 'node:assert'

describe('calendarResolvers', () => {
  it('delegates to deps.listEventsFromAllCalendars', async () => {
    const { calendarResolvers } = await import('./calendar.resolver.js')
    const stub = async () => [
      {
        id: '1',
        summary: 'Test',
        start: '2025-01-01T00:00:00Z',
        end: '2025-01-01T01:00:00Z',
        calendarSlot: 1,
      },
    ]
    const r = calendarResolvers(null, { listEventsFromAllCalendars: stub })
    const out = await r.Query.calendarEvents(null, {
      timeMin: '2025-01-01T00:00:00Z',
      timeMax: '2025-01-08T00:00:00Z',
    })
    assert.ok(Array.isArray(out))
    assert.strictEqual(out[0].id, '1')
  })
})

