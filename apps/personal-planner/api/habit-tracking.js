import { validateAccess } from './_lib/auth.js'
import { fetchTable } from './_lib/airtable.js'

const TABLE = process.env.AIRTABLE_TABLE_HABIT_TRACKING || 'Habit Tracking'

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json')
  const auth = validateAccess(req)
  if (!auth.valid) {
    res.statusCode = auth.status
    res.end(JSON.stringify(auth.body))
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
