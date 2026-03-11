/**
 * Google Calendar integration: OAuth2 and Calendar API.
 * Uses Airtable Settings table (Key-Value): CAL_1_*, CAL_2_*, CAL_3_*.
 */
import { google } from 'googleapis'
import { getSetting, setSetting } from './settings.js'

const MAX_CALENDARS = 3
const SCOPES = ['https://www.googleapis.com/auth/calendar']
const KEY_PREFIX = 'CAL_'

function keyFor(slot, suffix) {
  return `${KEY_PREFIX}${slot}_${suffix}`
}

/**
 * Build OAuth2 client (no credentials set).
 */
function createOAuth2Client(redirectUri) {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  if (!clientId || !clientSecret) throw new Error('GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET required')
  return new google.auth.OAuth2(clientId, clientSecret, redirectUri)
}

/**
 * @param {string} redirectUri
 * @param {string|number} state - Slot (1, 2, or 3) to recover in callback
 * @returns {string} URL to redirect user to Google consent
 */
export function getAuthUrl(redirectUri, state) {
  const client = createOAuth2Client(redirectUri)
  return client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: SCOPES,
    state: String(state),
  })
}

/**
 * Exchange authorization code for tokens and store in Settings for the given slot.
 * @param {string} code - From ?code=... in oauth-callback
 * @param {string} redirectUri - Must match the one used in getAuthUrl
 * @param {string|number} state - Slot (1, 2, or 3)
 */
export async function exchangeCodeForTokens(code, redirectUri, state) {
  const slot = Number(state)
  if (!Number.isInteger(slot) || slot < 1 || slot > MAX_CALENDARS) {
    throw new Error(`Invalid state (slot): ${state}`)
  }
  const client = createOAuth2Client(redirectUri)
  const { tokens } = await client.getToken(code)
  const expiry = tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : ''
  await setSetting(keyFor(slot, 'SLOT'), String(slot))
  await setSetting(keyFor(slot, 'REFRESH_TOKEN'), tokens.refresh_token || '')
  await setSetting(keyFor(slot, 'ACCESS_TOKEN'), tokens.access_token || '')
  await setSetting(keyFor(slot, 'TOKEN_EXPIRY'), expiry)
  await setSetting(keyFor(slot, 'ID'), 'primary')
  await setSetting(keyFor(slot, 'LABEL'), '') // Can be set later from calendar list if needed
}

/**
 * @returns {Promise<Array<{ slot: number, refreshToken: string, accessToken?: string, expiry?: string, calendarId: string, label?: string }>>}
 */
export async function getStoredConnections() {
  const out = []
  for (let slot = 1; slot <= MAX_CALENDARS; slot++) {
    const refreshToken = await getSetting(keyFor(slot, 'REFRESH_TOKEN'))
    if (!refreshToken || !refreshToken.trim()) continue
    const calendarId = (await getSetting(keyFor(slot, 'ID'))) || 'primary'
    const label = await getSetting(keyFor(slot, 'LABEL'))
    out.push({
      slot,
      refreshToken: refreshToken.trim(),
      accessToken: (await getSetting(keyFor(slot, 'ACCESS_TOKEN'))) || undefined,
      expiry: (await getSetting(keyFor(slot, 'TOKEN_EXPIRY'))) || undefined,
      calendarId: calendarId.trim() || 'primary',
      label: label != null && label !== '' ? label.trim() : undefined,
    })
  }
  return out
}

/**
 * Clear all stored data for a slot (disconnect calendar).
 */
export async function clearConnection(slot) {
  const n = Number(slot)
  if (!Number.isInteger(n) || n < 1 || n > MAX_CALENDARS) return
  const keys = ['SLOT', 'REFRESH_TOKEN', 'ACCESS_TOKEN', 'TOKEN_EXPIRY', 'ID', 'LABEL']
  for (const suffix of keys) {
    await setSetting(keyFor(n, suffix), '')
  }
}

/**
 * Resolve calendar id: if CAL_N_CALENDAR_NAME is set (e.g. "Trastos"), fetch calendar list and return the id for that summary; otherwise return current calendarId.
 * @param {import('googleapis').calendar_v3.Calendar} calendar
 * @param {number} slot
 * @param {string} currentCalendarId
 * @returns {Promise<string>}
 */
async function resolveCalendarId(calendar, slot, currentCalendarId) {
  const name = (await getSetting(keyFor(slot, 'CALENDAR_NAME'))) || (await getSetting(keyFor(slot, 'NAME')))
  if (!name || !name.trim()) return currentCalendarId
  const want = name.trim().toLowerCase()
  try {
    const listRes = await calendar.calendarList.list()
    const items = listRes.data.items || []
    const found = items.find((item) => (item.summary || '').trim().toLowerCase() === want)
    if (found && found.id) return found.id
  } catch (err) {
    console.error(`[Calendar] slot ${slot} calendarList.list (resolve "${name}"):`, err.message)
  }
  return currentCalendarId
}

/**
 * Get a Calendar API client for the given slot (refreshes access token if needed).
 * If CAL_N_CALENDAR_NAME is set in Settings, the returned calendarId is the resolved one (e.g. "Trastos").
 * @param {number} slot - 1, 2, or 3
 * @returns {Promise<{ calendar: import('googleapis').calendar_v3.Calendar, calendarId: string }>}
 */
export async function getCalendarClientForSlot(slot) {
  const connections = await getStoredConnections()
  const conn = connections.find((c) => c.slot === slot)
  if (!conn) throw new Error(`No calendar connected for slot ${slot}`)

  const redirectUri = process.env.GOOGLE_CALENDAR_REDIRECT_URI || ''
  const client = createOAuth2Client(redirectUri || 'http://localhost:5173/api/calendar/oauth-callback')

  const expiry = conn.expiry ? new Date(conn.expiry).getTime() : 0
  const now = Date.now()
  const needsRefresh = !conn.accessToken || expiry < now + 60 * 1000 // refresh if expires in < 1 min

  if (needsRefresh && conn.refreshToken) {
    client.setCredentials({ refresh_token: conn.refreshToken })
    const { credentials } = await client.refreshAccessToken()
    await setSetting(keyFor(slot, 'ACCESS_TOKEN'), credentials.access_token || '')
    await setSetting(keyFor(slot, 'TOKEN_EXPIRY'), credentials.expiry_date ? new Date(credentials.expiry_date).toISOString() : '')
    client.setCredentials(credentials)
  } else if (conn.accessToken) {
    client.setCredentials({
      access_token: conn.accessToken,
      refresh_token: conn.refreshToken,
      expiry_date: conn.expiry ? new Date(conn.expiry).getTime() : null,
    })
  }

  const calendar = google.calendar({ version: 'v3', auth: client })
  const calendarId = await resolveCalendarId(calendar, slot, conn.calendarId)
  return { calendar, calendarId }
}

/** Ensure RFC3339 (Google requires timezone offset or Z). */
function toRFC3339(s) {
  if (!s || typeof s !== 'string') return s
  const t = s.trim()
  if (/[Zz]$/.test(t) || /[+-]\d{2}:?\d{2}$/.test(t)) return t
  return t + 'Z'
}

/**
 * List events from all connected calendars in the given time range; merge and add calendarSlot/calendarLabel.
 * If CAL_N_CALENDAR_NAME is set in Settings (e.g. "Trastos"), events are listed from that calendar instead of primary.
 * @param {string} timeMin - ISO datetime (will be normalized to RFC3339)
 * @param {string} timeMax - ISO datetime (will be normalized to RFC3339)
 * @returns {Promise<Array<{ id: string, summary: string, start: string, end: string, calendarSlot: number, calendarLabel?: string, calendarColor?: string, [k: string]: unknown }>>}
 */
export async function listEventsFromAllCalendars(timeMin, timeMax) {
  const connections = await getStoredConnections()
  if (connections.length === 0) return []

  const min = toRFC3339(timeMin)
  const max = toRFC3339(timeMax)
  const all = []
  for (const conn of connections) {
    try {
      const { calendar, calendarId } = await getCalendarClientForSlot(conn.slot)
      let calendarColor = null
      try {
        const listRes = await calendar.calendarList.list()
        const listItems = listRes.data.items || []
        const calendarEntry = listItems.find((item) => item.id === calendarId)
        if (calendarEntry?.backgroundColor) calendarColor = calendarEntry.backgroundColor
      } catch (listErr) {
        // non-fatal: events still listed, just without color
      }
      const res = await calendar.events.list({
        calendarId,
        timeMin: min,
        timeMax: max,
        singleEvents: true,
        orderBy: 'startTime',
      })
      const items = res.data.items || []
      for (const ev of items) {
        const start = ev.start?.dateTime || ev.start?.date || ''
        const end = ev.end?.dateTime || ev.end?.date || ''
        all.push({
          id: ev.id,
          summary: ev.summary || '',
          description: ev.description || '',
          start,
          end,
          calendarSlot: conn.slot,
          calendarLabel: conn.label,
          calendarColor: calendarColor || undefined,
          htmlLink: ev.htmlLink,
          location: ev.location,
        })
      }
    } catch (err) {
      console.error(`Calendar slot ${conn.slot} list error:`, err.message)
    }
  }
  all.sort((a, b) => (a.start < b.start ? -1 : a.start > b.start ? 1 : 0))
  return all
}

/**
 * Create an event in the calendar for the given slot.
 * @param {number} slot - 1, 2, or 3
 * @param {{ summary: string, description?: string, start: string, end: string, timeZone?: string }} body - start/end ISO or dateTime strings
 * @returns {Promise<object>} Created event from API
 */
export async function createEvent(slot, body) {
  const { calendar, calendarId } = await getCalendarClientForSlot(slot)
  const start = body.start || ''
  const end = body.end || ''
  const timeZone = body.timeZone || undefined
  const isAllDay = start.length <= 10 && end.length <= 10
  const requestBody = {
    summary: body.summary || '',
    description: body.description || '',
    start: isAllDay ? { date: start.slice(0, 10), timeZone } : { dateTime: start, timeZone },
    end: isAllDay ? { date: end.slice(0, 10), timeZone } : { dateTime: end, timeZone },
  }
  const res = await calendar.events.insert({
    calendarId,
    requestBody,
  })
  return res.data
}

/**
 * Update an existing event in the calendar for the given slot.
 * @param {number} slot - 1, 2, or 3
 * @param {string} eventId - Google Calendar event id
 * @param {{ summary?: string, description?: string, start?: string, end?: string, timeZone?: string }} body - fields to update
 * @returns {Promise<object>} Updated event from API
 */
export async function updateEvent(slot, eventId, body) {
  if (!eventId || !String(eventId).trim()) throw new Error('eventId is required')
  const { calendar, calendarId } = await getCalendarClientForSlot(slot)
  const start = body.start || ''
  const end = body.end || ''
  const timeZone = body.timeZone || undefined
  const isAllDay = start.length <= 10 && end.length <= 10
  const requestBody = {}
  if (body.summary !== undefined) requestBody.summary = body.summary
  if (body.description !== undefined) requestBody.description = body.description
  if (start && end) {
    requestBody.start = isAllDay ? { date: start.slice(0, 10), timeZone } : { dateTime: start, timeZone }
    requestBody.end = isAllDay ? { date: end.slice(0, 10), timeZone } : { dateTime: end, timeZone }
  }
  const res = await calendar.events.patch({
    calendarId,
    eventId: String(eventId).trim(),
    requestBody,
  })
  return res.data
}
