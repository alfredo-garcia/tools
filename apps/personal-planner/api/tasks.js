import { validateAccess } from './_lib/auth.js'
import { fetchTable, updateRecord } from './_lib/airtable.js'

const TABLE = process.env.AIRTABLE_TABLE_TASKS || 'Tasks'

function getPathSegments(pathname) {
  return (pathname || '').replace(/^\/api/, '').split('/').filter(Boolean)
}

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json')
  const auth = validateAccess(req)
  if (!auth.valid) {
    res.statusCode = auth.status
    res.end(JSON.stringify(auth.body))
    return
  }
  const segments = getPathSegments(req.url)
  const recordId = segments[1]

  if (recordId && req.method === 'PATCH') {
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
    return
  }

  if (req.method !== 'GET') {
    res.statusCode = 405
    res.end(JSON.stringify({ error: 'Method not allowed' }))
    return
  }

  try {
    const data = await fetchTable(TABLE)
    res.statusCode = 200
    res.end(JSON.stringify({ data }))
  } catch (err) {
    console.error('tasks error:', err)
    res.statusCode = 500
    res.end(JSON.stringify({ error: err.message }))
  }
}
