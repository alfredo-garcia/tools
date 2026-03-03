import { validateAccess } from '../_lib/auth.js'
import { updateRecord, getShoppingBase } from '../_lib/airtable.js'

/** Tabla Airtable "Shopping List". Status: Need | Have. */
const TABLE = process.env.AIRTABLE_TABLE_SHOPPING || 'Shopping List'

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
  const segments = pathname.replace(/^\/api\/shopping/, '').split('/').filter(Boolean)
  const recordId = segments[0]
  if (!recordId) {
    res.statusCode = 400
    res.end(JSON.stringify({ error: 'Missing record id' }))
    return
  }
  const body = req.body || {}
  const fields = {}
  if (body.Name != null && typeof body.Name === 'string') fields.Name = body.Name.trim()
  if (body.Category != null && typeof body.Category === 'string') fields.Category = body.Category.trim()
  if (body.Description != null && typeof body.Description === 'string') fields.Description = body.Description.trim()
  if (body['Image (Web)'] != null && typeof body['Image (Web)'] === 'string') fields['Image (Web)'] = body['Image (Web)'].trim()
  if (body['Name ES'] != null && typeof body['Name ES'] === 'string') fields['Name ES'] = body['Name ES'].trim()
  if (body.Notes != null && typeof body.Notes === 'string') fields.Notes = body.Notes.trim()
  if (body.Priority != null && typeof body.Priority === 'string') fields.Priority = body.Priority.trim()
  if (body.Quantity != null) fields.Quantity = body.Quantity === '' ? null : (typeof body.Quantity === 'number' ? body.Quantity : Number(body.Quantity))
  if (body.Status != null && typeof body.Status === 'string') fields.Status = body.Status.trim()
  if (body.Store != null && typeof body.Store === 'string') fields.Store = body.Store.trim()
  if (body.Unit != null && typeof body.Unit === 'string') fields.Unit = body.Unit.trim()

  if (Object.keys(fields).length === 0) {
    res.statusCode = 400
    res.end(JSON.stringify({ error: 'Body must include at least one field to update' }))
    return
  }
  try {
    const base = getShoppingBase()
    if (!base) {
      res.statusCode = 500
      res.end(JSON.stringify({ error: 'Airtable no configurado' }))
      return
    }
    const updated = await updateRecord(TABLE, recordId, fields, base)
    res.statusCode = 200
    res.end(JSON.stringify({ data: updated }))
  } catch (err) {
    console.error('shopping PATCH error:', err)
    res.statusCode = err.statusCode === 404 ? 404 : 500
    res.end(JSON.stringify({ error: err.message }))
  }
}
