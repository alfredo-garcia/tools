import { validateAccess } from '../../api/_lib/auth.js'
import {
  getAuthUrl,
  exchangeCodeForTokens,
  getStoredConnections,
  clearConnection,
  listEventsFromAllCalendars,
  createEvent,
  updateEvent,
} from '../../api/_lib/googleCalendar.js'

function getPathSegments(url) {
  const raw = (url || '').split('?')[0]
  return raw.replace(/^\/api/, '').split('/').filter(Boolean)
}

/** Build redirect URI for OAuth callback (used in getAuthUrl and exchangeCodeForTokens). */
function getRedirectUri(req) {
  if (process.env.GOOGLE_CALENDAR_REDIRECT_URI) return process.env.GOOGLE_CALENDAR_REDIRECT_URI
  let host = req.headers?.host || req.headers?.Host || 'localhost:5173'
  const proto = req.headers?.['x-forwarded-proto'] === 'https' ? 'https' : 'http'
  // In dev, /api is often proxied from Vite (5173) to the API server (3000). Google must redirect to the origin the user sees (5173), so use frontend origin when request hit the API port.
  const apiPort = process.env.PORT || '3000'
  if (host === `localhost:${apiPort}` || host === `127.0.0.1:${apiPort}`) {
    host = 'localhost:5173'
  }
  return `${proto}://${host}/api/calendar/oauth-callback`
}

/** Parse JSON body from req (Vercel/serverless may attach it). */
function getBody(req) {
  if (req.body && typeof req.body === 'object') return req.body
  return {}
}

export default async function handler(req, res) {
  const segments = getPathSegments(req.url)
  const action = segments[1] // oauth | oauth-callback | status | events | connections
  const subId = segments[2]  // for connections/:slot

  // OAuth redirects: no auth header required (user is not logged in yet when clicking Connect)
  if (action === 'oauth') {
    const slot = req.query?.slot ?? req.query?.path?.[1]
    const slotNum = slot != null ? Number(slot) : NaN
    if (!Number.isInteger(slotNum) || slotNum < 1 || slotNum > 3) {
      res.setHeader('Content-Type', 'application/json')
      res.statusCode = 400
      res.end(JSON.stringify({ error: 'Query slot=1|2|3 required' }))
      return
    }
    try {
      const redirectUri = getRedirectUri(req)
      const url = getAuthUrl(redirectUri, slotNum)
      res.statusCode = 302
      res.setHeader('Location', url)
      res.end()
    } catch (err) {
      console.error('calendar oauth error:', err)
      res.setHeader('Content-Type', 'application/json')
      res.statusCode = 500
      res.end(JSON.stringify({ error: err.message || 'OAuth failed' }))
    }
    return
  }

  if (action === 'oauth-callback') {
    const code = req.query?.code
    const state = req.query?.state
    if (!code || !state) {
      res.statusCode = 302
      res.setHeader('Location', '/settings?calendar=error&reason=missing_params')
      res.end()
      return
    }
    try {
      const redirectUri = getRedirectUri(req)
      await exchangeCodeForTokens(code, redirectUri, state)
      res.statusCode = 302
      res.setHeader('Location', '/settings?calendar=connected&slot=' + encodeURIComponent(state))
      res.end()
    } catch (err) {
      console.error('calendar oauth-callback error:', err)
      res.statusCode = 302
      res.setHeader('Location', '/settings?calendar=error&reason=exchange_failed')
      res.end()
    }
    return
  }

  // All other routes require app auth
  res.setHeader('Content-Type', 'application/json')
  const auth = validateAccess(req)
  if (!auth.valid) {
    res.statusCode = auth.status
    res.end(JSON.stringify(auth.body))
    return
  }

  if (action === 'status') {
    try {
      const connections = await getStoredConnections()
      const list = connections.map((c) => ({
        slot: c.slot,
        label: c.label,
        calendarId: c.calendarId,
      }))
      res.statusCode = 200
      res.end(JSON.stringify({ connections: list }))
    } catch (err) {
      console.error('calendar status error:', err)
      res.statusCode = 500
      res.end(JSON.stringify({ error: err.message || 'Failed to get status' }))
    }
    return
  }

  if (action === 'events') {
    if (req.method === 'GET') {
      const timeMin = req.query?.timeMin || ''
      const timeMax = req.query?.timeMax || ''
      if (!timeMin || !timeMax) {
        res.statusCode = 400
        res.end(JSON.stringify({ error: 'timeMin and timeMax query params required' }))
        return
      }
      try {
        const events = await listEventsFromAllCalendars(timeMin, timeMax)
        res.statusCode = 200
        res.end(JSON.stringify({ data: events }))
      } catch (err) {
        console.error('calendar events list error:', err)
        const code = err.message?.includes('No calendar connected') ? 401 : 500
        res.statusCode = code
        res.end(JSON.stringify({ error: err.message || 'Failed to list events' }))
      }
      return
    }

    if (req.method === 'POST') {
      const body = getBody(req)
      const slot = body.calendarSlot != null ? Number(body.calendarSlot) : 1
      if (!Number.isInteger(slot) || slot < 1 || slot > 3) {
        res.statusCode = 400
        res.end(JSON.stringify({ error: 'calendarSlot must be 1, 2, or 3' }))
        return
      }
      try {
        const event = await createEvent(slot, {
          summary: body.summary,
          description: body.description,
          start: body.start,
          end: body.end,
          timeZone: body.timeZone,
        })
        res.statusCode = 201
        res.end(JSON.stringify({ data: event }))
      } catch (err) {
        console.error('calendar events create error:', err)
        const code = err.message?.includes('No calendar connected') ? 401 : 500
        res.statusCode = code
        res.end(JSON.stringify({ error: err.message || 'Failed to create event' }))
      }
      return
    }

    if (req.method === 'PATCH') {
      const body = getBody(req)
      const eventId = body.eventId ?? body.id
      const slot = body.calendarSlot != null ? Number(body.calendarSlot) : 1
      if (!eventId || typeof eventId !== 'string' || !eventId.trim()) {
        res.statusCode = 400
        res.end(JSON.stringify({ error: 'eventId is required' }))
        return
      }
      if (!Number.isInteger(slot) || slot < 1 || slot > 3) {
        res.statusCode = 400
        res.end(JSON.stringify({ error: 'calendarSlot must be 1, 2, or 3' }))
        return
      }
      try {
        const event = await updateEvent(slot, eventId.trim(), {
          summary: body.summary,
          description: body.description,
          start: body.start,
          end: body.end,
          timeZone: body.timeZone,
        })
        res.statusCode = 200
        res.end(JSON.stringify({ data: event }))
      } catch (err) {
        console.error('calendar events update error:', err)
        const code = err.message?.includes('No calendar connected') ? 401 : 500
        res.statusCode = code
        res.end(JSON.stringify({ error: err.message || 'Failed to update event' }))
      }
      return
    }

    res.statusCode = 405
    res.end(JSON.stringify({ error: 'Method not allowed' }))
    return
  }

  if (action === 'connections' && subId !== undefined && req.method === 'DELETE') {
    const slot = Number(subId)
    if (!Number.isInteger(slot) || slot < 1 || slot > 3) {
      res.statusCode = 400
      res.end(JSON.stringify({ error: 'Slot must be 1, 2, or 3' }))
      return
    }
    try {
      await clearConnection(slot)
      res.statusCode = 200
      res.end(JSON.stringify({ disconnected: slot }))
    } catch (err) {
      console.error('calendar disconnect error:', err)
      res.statusCode = 500
      res.end(JSON.stringify({ error: err.message || 'Failed to disconnect' }))
    }
    return
  }

  res.statusCode = 404
  res.end(JSON.stringify({ error: 'Not found', path: req.url }))
}
