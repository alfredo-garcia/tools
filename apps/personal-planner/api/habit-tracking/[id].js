import { validateAccess } from '../_lib/auth.js'
import { deleteRecord } from '../_lib/airtable.js'

const TABLE = process.env.AIRTABLE_TABLE_HABIT_TRACKING || 'Habit Tracking'

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json')
  const auth = validateAccess(req)
  if (!auth.valid) {
    res.statusCode = auth.status
    res.end(JSON.stringify(auth.body))
    return
  }
  if (req.method !== 'DELETE') {
    res.statusCode = 405
    res.end(JSON.stringify({ error: 'Method not allowed' }))
    return
  }
  const pathname = (req.url || '').split('?')[0].replace(/\/$/, '')
  const segments = pathname.replace(/^\/api\/habit-tracking/, '').split('/').filter(Boolean)
  const recordId = segments[0]
  if (!recordId) {
    res.statusCode = 400
    res.end(JSON.stringify({ error: 'Missing record id' }))
    return
  }
  try {
    await deleteRecord(TABLE, recordId)
    res.statusCode = 204
    res.end()
  } catch (err) {
    console.error('habit-tracking DELETE error:', err)
    res.statusCode = err.statusCode === 404 ? 404 : 500
    res.end(JSON.stringify({ error: err.message }))
  }
}
