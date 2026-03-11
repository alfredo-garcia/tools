import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('./settings.js', () => ({
  getSetting: vi.fn(),
  setSetting: vi.fn(),
}))

describe('googleCalendar', () => {
  const originalEnv = process.env

  beforeEach(() => {
    vi.resetModules()
    process.env = {
      ...originalEnv,
      GOOGLE_CLIENT_ID: 'test-client-id',
      GOOGLE_CLIENT_SECRET: 'test-client-secret',
    }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  describe('getAuthUrl', () => {
    it('returns a URL containing state and calendar scope', async () => {
      const { getAuthUrl } = await import('./googleCalendar.js')
      const url = getAuthUrl('http://localhost:5173/api/calendar/oauth-callback', 1)
      expect(url).toContain('accounts.google.com')
      expect(url).toContain('state=1')
      expect(url).toContain('scope=')
      expect(url).toContain('calendar')
      expect(url).toContain('redirect_uri=')
    })
  })
})
