import Airtable from 'airtable'
import { validateAccess } from './_lib/auth.js'

/**
 * GET /api/data — Ejemplo: lee registros de Airtable (requiere Authorization).
 */
export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json')
  const auth = validateAccess(req)
  if (!auth.valid) {
    res.statusCode = auth.status
    res.end(JSON.stringify(auth.body))
    return
  }

  const pat = process.env.AIRTABLE_PAT
  const baseId = process.env.AIRTABLE_BASE_ID
  const tableName = process.env.AIRTABLE_TABLE_NAME || 'Table 1'

  if (!pat || !baseId) {
    res.statusCode = 500
    res.end(JSON.stringify({
      error: 'Faltan AIRTABLE_PAT o AIRTABLE_BASE_ID en el entorno.'
    }))
    return
  }

  try {
    const base = new Airtable({ apiKey: pat }).base(baseId)
    const rows = await new Promise((resolve, reject) => {
      const results = []
      base(tableName)
        .select({ maxRecords: 100 })
        .eachPage(
          (pageRecords, next) => {
            pageRecords.forEach((r) => {
              results.push({ id: r.id, ...r.fields })
            })
            next()
          },
          (err) => (err ? reject(err) : resolve(results))
        )
    })
    res.statusCode = 200
    res.end(JSON.stringify({ data: rows }))
  } catch (err) {
    console.error('Airtable error:', err)
    res.statusCode = 500
    res.end(JSON.stringify({
      error: 'Error al leer Airtable.',
      detail: err.message
    }))
  }
}
