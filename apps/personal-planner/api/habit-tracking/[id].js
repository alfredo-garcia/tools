import { validateAccess } from '../_lib/auth.js'
import { deleteRecord, updateRecord } from '../_lib/airtable.js'

const TABLE = process.env.AIRTABLE_TABLE_HABIT_TRACKING || 'Habit Tracking'

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json')
  const auth = validateAccess(req)
  if (!auth.valid) {
    res.statusCode = auth.status
    res.end(JSON.stringify(auth.body))
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

  if (req.method === 'PATCH') {
    const successful = req.body?.['Was Successful?']
    if (typeof successful !== 'boolean') {
      res.statusCode = 400
      res.end(JSON.stringify({ error: 'Body must include "Was Successful?" (boolean)' }))
      return
    }
    try {
      const updated = await updateRecord(TABLE, recordId, { 'Was Successful?': successful })
      res.statusCode = 200
      res.end(JSON.stringify({ data: updated }))
    } catch (err) {
      console.error('habit-tracking PATCH error:', err)
      res.statusCode = err.statusCode === 404 ? 404 : 500
      res.end(JSON.stringify({ error: err.message }))
    }
    return
  }

  if (req.method === 'DELETE') {
    try {
      await deleteRecord(TABLE, recordId)
      res.statusCode = 204
      res.end()
    } catch (err) {
      console.error('habit-tracking DELETE error:', err)
      res.statusCode = err.statusCode === 404 ? 404 : 500
      res.end(JSON.stringify({ error: err.message }))
    }
    return
  }

  res.statusCode = 405
  res.end(JSON.stringify({ error: 'Method not allowed' }))
}
