import { validateAccess } from './_lib/auth.js'
import { fetchTable, createRecord, deleteRecord } from './_lib/airtable.js'

const TABLE = process.env.AIRTABLE_TABLE_HABIT_TRACKING || 'Habit Tracking'

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

  if (recordId && req.method === 'DELETE') {
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

  if (req.method === 'POST' && !recordId) {
    const habitId = req.body?.Habit
    const dateStr = req.body?.date
    if (!habitId || !dateStr) {
      res.statusCode = 400
      res.end(JSON.stringify({ error: 'Body must include Habit (record id) and date (YYYY-MM-DD)' }))
      return
    }
    const habitIdTrimmed = typeof habitId === 'string' ? habitId.trim() : null
    if (!habitIdTrimmed) {
      res.statusCode = 400
      res.end(JSON.stringify({ error: 'Habit must be a non-empty string' }))
      return
    }
    const d = new Date(dateStr)
    if (Number.isNaN(d.getTime())) {
      res.statusCode = 400
      res.end(JSON.stringify({ error: 'date must be a valid date string (YYYY-MM-DD)' }))
      return
    }
    const isoDate = d.toISOString().slice(0, 10) + 'T12:00:00.000Z'
    try {
      const created = await createRecord(TABLE, {
        Habit: [habitIdTrimmed],
        'Execution Date-Time': isoDate,
        'Was Successful?': true,
      })
      res.statusCode = 201
      res.end(JSON.stringify({ data: created }))
    } catch (err) {
      console.error('habit-tracking POST error:', err)
      res.statusCode = 500
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
    const data = await fetchTable(TABLE, 1000)
    res.statusCode = 200
    res.end(JSON.stringify({ data }))
  } catch (err) {
    console.error('habit-tracking error:', err)
    res.statusCode = 500
    res.end(JSON.stringify({ error: err.message }))
  }
}
