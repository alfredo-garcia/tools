import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('./settings.js', () => ({
  getSetting: vi.fn(),
  setSetting: vi.fn(),
}))

// Shared calendar list for tests that need resolveCalendarId (e.g. CAL_1_NAME)
const mockCalendarListItems = []
vi.mock('googleapis', () => ({
  google: {
    auth: {
      OAuth2: function () {
        return {
          generateAuthUrl: () => 'https://accounts.google.com/o/oauth2/v2/auth?state=1&scope=calendar&redirect_uri=http%3A%2F%2Flocalhost',
          getToken: () => ({ tokens: {} }),
          setCredentials: vi.fn(),
          refreshAccessToken: () => ({ credentials: {} }),
        }
      },
    },
    calendar: () => ({
      calendarList: {
        list: () => Promise.resolve({ data: { items: mockCalendarListItems } }),
      },
      events: { list: vi.fn(), insert: vi.fn() },
    }),
  },
}))

describe('googleCalendar', () => {
  const originalEnv = process.env

  beforeEach(() => {
    vi.resetModules()
    mockCalendarListItems.length = 0
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

  describe('calendar name resolution', () => {
    it('uses CAL_1_NAME when CAL_1_CALENDAR_NAME is not set (e.g. Airtable key CAL_1_NAME = Trastos)', async () => {
      const { getSetting } = await import('./settings.js')
      mockCalendarListItems.push({ id: 'trastos-id@group.calendar.google.com', summary: 'Trastos' })
      getSetting.mockImplementation((key) => {
        const slot1Keys = {
          CAL_1_SLOT: '1',
          CAL_1_REFRESH_TOKEN: 'refresh',
          CAL_1_ACCESS_TOKEN: 'access',
          CAL_1_TOKEN_EXPIRY: new Date(Date.now() + 3600000).toISOString(),
          CAL_1_ID: 'primary',
          CAL_1_LABEL: '',
          CAL_1_CALENDAR_NAME: '',
          CAL_1_NAME: 'Trastos',
        }
        return Promise.resolve(slot1Keys[key] ?? '')
      })

      const { getCalendarClientForSlot } = await import('./googleCalendar.js')
      const { calendarId } = await getCalendarClientForSlot(1)
      expect(calendarId).toBe('trastos-id@group.calendar.google.com')
      expect(getSetting).toHaveBeenCalledWith('CAL_1_CALENDAR_NAME')
      expect(getSetting).toHaveBeenCalledWith('CAL_1_NAME')
    })
  })
})
