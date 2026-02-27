import { validateAccess } from '../_lib/auth.js'
import { updateRecord } from '../_lib/airtable.js'

const TABLE = process.env.AIRTABLE_TABLE_TASKS || 'Tasks'

/** Mapeo de valores que envía el frontend a opciones del Single Select en Airtable (evita INVALID_MULTIPLE_CHOICE_OPTIONS). */
const STATUS_TO_AIRTABLE = {
  Pending: 'Todo',
  'In Progress': 'In Progress',
  Done: 'Done',
}

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json')
  const auth = validateAccess(req)
  if (!auth.valid) {
    res.statusCode = auth.status
    res.end(JSON.stringify(auth.body))
    return
  }
  if (req.method !== 'PATCH') {
    res.statusCode = 405
    res.end(JSON.stringify({ error: 'Method not allowed' }))
    return
  }
  const pathname = (req.url || '').split('?')[0].replace(/\/$/, '')
  const segments = pathname.replace(/^\/api\/tasks/, '').split('/').filter(Boolean)
  const recordId = segments[0]
  if (!recordId) {
    res.statusCode = 400
    res.end(JSON.stringify({ error: 'Missing record id' }))
    return
  }
  const status = req.body?.Status
  if (status == null || typeof status !== 'string') {
    res.statusCode = 400
    res.end(JSON.stringify({ error: 'Body must include Status (string)' }))
    return
  }
  const value = status.trim()
  const airtableStatus = STATUS_TO_AIRTABLE[value] ?? value
  try {
    const updated = await updateRecord(TABLE, recordId, { Status: airtableStatus })
    res.statusCode = 200
    res.end(JSON.stringify({ data: updated }))
  } catch (err) {
    console.error('tasks PATCH error:', err)
    res.statusCode = err.statusCode === 404 ? 404 : 500
    res.end(JSON.stringify({ error: err.message }))
  }
}
