import { validateAccess } from '../_lib/auth.js'
import { updateRecord } from '../_lib/airtable.js'

const TABLE = process.env.AIRTABLE_TABLE_TASKS || 'Tasks'

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
  try {
    const updated = await updateRecord(TABLE, recordId, { Status: status.trim() })
    res.statusCode = 200
    res.end(JSON.stringify({ data: updated }))
  } catch (err) {
    console.error('tasks PATCH error:', err)
    res.statusCode = err.statusCode === 404 ? 404 : 500
    res.end(JSON.stringify({ error: err.message }))
  }
}
