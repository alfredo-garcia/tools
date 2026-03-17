/**
 * Google Calendar integration (list events only).
 * Reads tokens from Airtable Settings table (Key-Value): CAL_1_*, CAL_2_*, CAL_3_*.
 */
import { google } from 'googleapis'
import { getSetting, setSetting, getSettingsByPrefix } from './settings.js'

const MAX_CALENDARS = 3
const SCOPES = ['https://www.googleapis.com/auth/calendar']
const KEY_PREFIX = 'CAL_'

function keyFor(slot, suffix) {
  return `${KEY_PREFIX}${slot}_${suffix}`
}

function createOAuth2Client(redirectUri) {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  if (!clientId || !clientSecret) throw new Error('GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET required')
  return new google.auth.OAuth2(clientId, clientSecret, redirectUri)
}

export function getAuthUrl(redirectUri, state) {
  const client = createOAuth2Client(redirectUri)
  return client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: SCOPES,
    state: String(state),
  })
}

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
  await setSetting(keyFor(slot, 'LABEL'), '')
}

export async function getStoredConnections(settingsMap) {
  if (settingsMap && settingsMap.size > 0) {
    const out = []
    for (let slot = 1; slot <= MAX_CALENDARS; slot++) {
      const refreshToken = settingsMap.get(keyFor(slot, 'REFRESH_TOKEN'))
      if (!refreshToken || !refreshToken.trim()) continue
      const calendarId = settingsMap.get(keyFor(slot, 'ID')) || 'primary'
      const label = settingsMap.get(keyFor(slot, 'LABEL'))
      out.push({
        slot,
        refreshToken: refreshToken.trim(),
        accessToken: settingsMap.get(keyFor(slot, 'ACCESS_TOKEN')) || undefined,
        expiry: settingsMap.get(keyFor(slot, 'TOKEN_EXPIRY')) || undefined,
        calendarId: (calendarId && calendarId.trim()) || 'primary',
        label: label != null && label !== '' ? String(label).trim() : undefined,
      })
    }
    return out
  }
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

async function resolveCalendarId(calendar, slot, currentCalendarId, settingsMap) {
  const name = settingsMap
    ? (settingsMap.get(keyFor(slot, 'CALENDAR_NAME')) || settingsMap.get(keyFor(slot, 'NAME')) || '')
    : (await getSetting(keyFor(slot, 'CALENDAR_NAME'))) || (await getSetting(keyFor(slot, 'NAME'))) || ''
  if (!name || !name.trim()) return currentCalendarId
  const want = name.trim().toLowerCase()
  try {
    const listRes = await calendar.calendarList.list()
    const items = listRes.data.items || []
    const found = items.find((item) => (item.summary || '').trim().toLowerCase() === want)
    if (found && found.id) return found.id
  } catch (err) {
    // non-fatal
  }
  return currentCalendarId
}

export async function getCalendarClientForSlot(slot, connectionsCache, settingsMap) {
  const connections = connectionsCache && connectionsCache.length ? connectionsCache : await getStoredConnections()
  const conn = connections.find((c) => c.slot === slot)
  if (!conn) throw new Error(`No calendar connected for slot ${slot}`)

  const redirectUri = process.env.GOOGLE_CALENDAR_REDIRECT_URI || ''
  const client = createOAuth2Client(redirectUri || 'http://localhost:5173/api/calendar/oauth-callback')

  const expiry = conn.expiry ? new Date(conn.expiry).getTime() : 0
  const now = Date.now()
  const needsRefresh = !conn.accessToken || expiry < now + 60 * 1000

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
  const calendarId = await resolveCalendarId(calendar, slot, conn.calendarId, settingsMap)
  return { calendar, calendarId }
}

function toRFC3339(s) {
  if (!s || typeof s !== 'string') return s
  const t = s.trim()
  if (/[Zz]$/.test(t) || /[+-]\d{2}:?\d{2}$/.test(t)) return t
  return t + 'Z'
}

function parseBlacklist(raw) {
  if (!raw || typeof raw !== 'string') return []
  const parts = raw.split(',').map((s) => s.trim())
  return parts
    .map((s) => {
      if (s.length >= 2 && s.startsWith('"') && s.endsWith('"')) return s.slice(1, -1).trim()
      return s
    })
    .filter(Boolean)
}

export async function listEventsFromAllCalendars(timeMin, timeMax) {
  const settingsMap = await getSettingsByPrefix(KEY_PREFIX)
  const connections = await getStoredConnections(settingsMap)
  if (connections.length === 0) return []

  const min = toRFC3339(timeMin)
  const max = toRFC3339(timeMax)
  const all = []

  const fetchOneCalendar = async (conn) => {
    try {
      const blacklistRaw = settingsMap.get(keyFor(conn.slot, 'BLACKLIST')) ?? null
      const { calendar, calendarId } = await getCalendarClientForSlot(conn.slot, connections, settingsMap)

      let calendarColor = null
      try {
        const listRes = await calendar.calendarList.list()
        const listItems = listRes.data.items || []
        const calendarEntry = listItems.find((item) => item.id === calendarId)
        if (calendarEntry?.backgroundColor) calendarColor = calendarEntry.backgroundColor
      } catch {
        // non-fatal
      }

      const res = await calendar.events.list({
        calendarId,
        timeMin: min,
        timeMax: max,
        singleEvents: true,
        orderBy: 'startTime',
      })

      const blacklist = parseBlacklist(blacklistRaw).map((name) => name.toLowerCase())
      const items = res.data.items || []
      for (const ev of items) {
        if (ev.eventType === 'workingLocation' || ev.eventType === 'focusTime' || ev.eventType === 'outOfOffice') continue
        const summary = (ev.summary || '').trim()
        if (blacklist.length && blacklist.includes(summary.toLowerCase())) continue
        const start = ev.start?.dateTime || ev.start?.date || ''
        const end = ev.end?.dateTime || ev.end?.date || ''
        all.push({
          id: ev.id,
          summary,
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

  await Promise.all(connections.map(fetchOneCalendar))
  all.sort((a, b) => (a.start < b.start ? -1 : a.start > b.start ? 1 : 0))
  return all
}

