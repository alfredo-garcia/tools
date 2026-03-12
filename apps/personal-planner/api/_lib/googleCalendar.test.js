import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('./settings.js', () => ({
  getSetting: vi.fn(),
  setSetting: vi.fn(),
  getSettingsByPrefix: vi.fn(),
}))

// Shared calendar list for tests that need resolveCalendarId (e.g. CAL_1_NAME)
const mockCalendarListItems = []
const mockEventsList = vi.fn()
const mockEventsInsert = vi.fn()
const mockEventsPatch = vi.fn()
const mockEventsDelete = vi.fn()
const mockCalendarInstance = {
  calendarList: {
    list: () => Promise.resolve({ data: { items: mockCalendarListItems } }),
  },
  events: { list: mockEventsList, insert: mockEventsInsert, patch: mockEventsPatch, delete: mockEventsDelete },
}
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
    calendar: () => mockCalendarInstance,
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
      CALENDAR_PERF_LOG: '0',
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

  describe('listEventsFromAllCalendars', () => {
    it('adds calendarColor from calendar list backgroundColor when present', async () => {
      const { getSetting, getSettingsByPrefix } = await import('./settings.js')
      const slot1Keys = {
        CAL_1_SLOT: '1',
        CAL_1_REFRESH_TOKEN: 'refresh',
        CAL_1_ACCESS_TOKEN: 'access',
        CAL_1_TOKEN_EXPIRY: new Date(Date.now() + 3600000).toISOString(),
        CAL_1_ID: 'primary',
        CAL_1_LABEL: 'Work',
        CAL_1_CALENDAR_NAME: '',
        CAL_1_NAME: '',
      }
      getSetting.mockImplementation((key) => Promise.resolve(slot1Keys[key] ?? ''))
      getSettingsByPrefix.mockImplementation(() => Promise.resolve(new Map(Object.entries(slot1Keys))))
      mockCalendarListItems.push({ id: 'primary', backgroundColor: '#0088aa' })
      mockEventsList.mockResolvedValue({
        data: {
          items: [
            {
              id: 'ev1',
              summary: 'Meeting',
              start: { dateTime: '2025-03-10T10:00:00Z' },
              end: { dateTime: '2025-03-10T11:00:00Z' },
            },
          ],
        },
      })

      const { listEventsFromAllCalendars } = await import('./googleCalendar.js')
      const events = await listEventsFromAllCalendars('2025-03-10T00:00:00Z', '2025-03-11T00:00:00Z')
      expect(events).toHaveLength(1)
      expect(events[0].calendarColor).toBe('#0088aa')
      expect(events[0].summary).toBe('Meeting')
    })

    it('excludes working location, focus time, and out of office events', async () => {
      const { getSetting, getSettingsByPrefix } = await import('./settings.js')
      const slot1Keys = {
        CAL_1_SLOT: '1',
        CAL_1_REFRESH_TOKEN: 'refresh',
        CAL_1_ACCESS_TOKEN: 'access',
        CAL_1_TOKEN_EXPIRY: new Date(Date.now() + 3600000).toISOString(),
        CAL_1_ID: 'primary',
        CAL_1_LABEL: '',
        CAL_1_CALENDAR_NAME: '',
        CAL_1_NAME: '',
      }
      getSetting.mockImplementation((key) => Promise.resolve(slot1Keys[key] ?? ''))
      getSettingsByPrefix.mockImplementation(() => Promise.resolve(new Map(Object.entries(slot1Keys))))
      mockCalendarListItems.push({ id: 'primary' })
      mockEventsList.mockResolvedValue({
        data: {
          items: [
            { id: 'ev1', summary: 'Normal meeting', start: { dateTime: '2025-03-10T10:00:00Z' }, end: { dateTime: '2025-03-10T11:00:00Z' } },
            { id: 'ev2', summary: 'Office', eventType: 'workingLocation', start: { dateTime: '2025-03-10T09:00:00Z' }, end: { dateTime: '2025-03-10T17:00:00Z' } },
            { id: 'ev3', summary: 'Focus', eventType: 'focusTime', start: { dateTime: '2025-03-10T14:00:00Z' }, end: { dateTime: '2025-03-10T15:00:00Z' } },
            { id: 'ev4', summary: 'OOO', eventType: 'outOfOffice', start: { dateTime: '2025-03-11T09:00:00Z' }, end: { dateTime: '2025-03-11T17:00:00Z' } },
          ],
        },
      })

      const { listEventsFromAllCalendars } = await import('./googleCalendar.js')
      const events = await listEventsFromAllCalendars('2025-03-10T00:00:00Z', '2025-03-12T00:00:00Z')
      expect(events).toHaveLength(1)
      expect(events[0].id).toBe('ev1')
      expect(events[0].summary).toBe('Normal meeting')
    })

    it('filters out events whose summary matches CAL_N_BLACKLIST (names in quotes, comma-separated)', async () => {
      const { getSetting, getSettingsByPrefix } = await import('./settings.js')
      const slot1Keys = {
        CAL_1_SLOT: '1',
        CAL_1_REFRESH_TOKEN: 'refresh',
        CAL_1_ACCESS_TOKEN: 'access',
        CAL_1_TOKEN_EXPIRY: new Date(Date.now() + 3600000).toISOString(),
        CAL_1_ID: 'primary',
        CAL_1_LABEL: '',
        CAL_1_CALENDAR_NAME: '',
        CAL_1_NAME: '',
        CAL_1_BLACKLIST: '"Reunión interna", "Blocked", "No mostrar"',
      }
      getSetting.mockImplementation((key) => Promise.resolve(slot1Keys[key] ?? ''))
      getSettingsByPrefix.mockImplementation(() => Promise.resolve(new Map(Object.entries(slot1Keys))))
      mockCalendarListItems.push({ id: 'primary' })
      mockEventsList.mockResolvedValue({
        data: {
          items: [
            { id: 'ev1', summary: 'Keep this', start: { dateTime: '2025-03-10T10:00:00Z' }, end: { dateTime: '2025-03-10T11:00:00Z' } },
            { id: 'ev2', summary: 'Reunión interna', start: { dateTime: '2025-03-10T12:00:00Z' }, end: { dateTime: '2025-03-10T13:00:00Z' } },
            { id: 'ev3', summary: 'Blocked', start: { dateTime: '2025-03-10T14:00:00Z' }, end: { dateTime: '2025-03-10T15:00:00Z' } },
            { id: 'ev4', summary: 'Another visible', start: { dateTime: '2025-03-10T16:00:00Z' }, end: { dateTime: '2025-03-10T17:00:00Z' } },
          ],
        },
      })

      const { listEventsFromAllCalendars } = await import('./googleCalendar.js')
      const events = await listEventsFromAllCalendars('2025-03-10T00:00:00Z', '2025-03-11T00:00:00Z')
      expect(events).toHaveLength(2)
      expect(events.map((e) => e.summary)).toEqual(['Keep this', 'Another visible'])
    })
  })

  describe('updateEvent', () => {
    it('calls calendar.events.patch with eventId and requestBody', async () => {
      const { getSetting } = await import('./settings.js')
      getSetting.mockImplementation((key) => {
        const keys = {
          CAL_1_SLOT: '1',
          CAL_1_REFRESH_TOKEN: 'refresh',
          CAL_1_ACCESS_TOKEN: 'access',
          CAL_1_TOKEN_EXPIRY: new Date(Date.now() + 3600000).toISOString(),
          CAL_1_ID: 'primary',
          CAL_1_LABEL: '',
          CAL_1_CALENDAR_NAME: '',
          CAL_1_NAME: '',
        }
        return Promise.resolve(keys[key] ?? '')
      })
      mockEventsPatch.mockResolvedValue({
        data: {
          id: 'ev-123',
          summary: 'Updated meeting',
          start: { dateTime: '2025-03-10T14:00:00Z' },
          end: { dateTime: '2025-03-10T15:00:00Z' },
        },
      })

      const { updateEvent } = await import('./googleCalendar.js')
      const result = await updateEvent(1, 'ev-123', {
        summary: 'Updated meeting',
        description: 'Notes',
        start: '2025-03-10T14:00:00',
        end: '2025-03-10T15:00:00',
        timeZone: 'Europe/Madrid',
      })

      expect(mockEventsPatch).toHaveBeenCalledWith(
        expect.objectContaining({
          calendarId: 'primary',
          eventId: 'ev-123',
          requestBody: expect.objectContaining({
            summary: 'Updated meeting',
            description: 'Notes',
          }),
        })
      )
      expect(result.summary).toBe('Updated meeting')
    })

    it('throws when eventId is missing', async () => {
      const { updateEvent } = await import('./googleCalendar.js')
      await expect(updateEvent(1, '', { summary: 'x' })).rejects.toThrow('eventId is required')
      await expect(updateEvent(1, '  ', { summary: 'x' })).rejects.toThrow('eventId is required')
    })
  })

  describe('deleteEvent', () => {
    it('calls calendar.events.delete with slot calendar and eventId', async () => {
      const { getSetting } = await import('./settings.js')
      getSetting.mockImplementation((key) => {
        const keys = {
          CAL_1_SLOT: '1',
          CAL_1_REFRESH_TOKEN: 'refresh',
          CAL_1_ACCESS_TOKEN: 'access',
          CAL_1_TOKEN_EXPIRY: new Date(Date.now() + 3600000).toISOString(),
          CAL_1_ID: 'primary',
          CAL_1_LABEL: '',
          CAL_1_CALENDAR_NAME: '',
          CAL_1_NAME: '',
        }
        return Promise.resolve(keys[key] ?? '')
      })
      mockEventsDelete.mockResolvedValue(undefined)

      const { deleteEvent } = await import('./googleCalendar.js')
      await deleteEvent(1, 'ev-456')

      expect(mockEventsDelete).toHaveBeenCalledWith({
        calendarId: 'primary',
        eventId: 'ev-456',
      })
    })

    it('throws when eventId is missing', async () => {
      const { deleteEvent } = await import('./googleCalendar.js')
      await expect(deleteEvent(1, '')).rejects.toThrow('eventId is required')
      await expect(deleteEvent(1, '  ')).rejects.toThrow('eventId is required')
    })
  })
})
