import { validateAccess } from './_lib/auth.js'
import { fetchTable } from './_lib/airtable.js'

const TABLE = process.env.AIRTABLE_TABLE_HABITS || 'Habits'

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json')
  const auth = validateAccess(req)
  if (!auth.valid) {
    res.statusCode = auth.status
    res.end(JSON.stringify(auth.body))
    return
  }
  try {
    const data = await fetchTable(TABLE)
    res.statusCode = 200
    res.end(JSON.stringify({ data }))
  } catch (err) {
    console.error('habits error:', err)
    res.statusCode = 500
    res.end(JSON.stringify({ error: err.message }))
  }
}
