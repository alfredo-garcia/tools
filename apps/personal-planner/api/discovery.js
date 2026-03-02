import { validateAccess } from './_lib/auth.js'
import { fetchTable, createRecord, updateRecord, deleteRecord } from './_lib/airtable.js'

/** Tabla Airtable "Discovery Ideas": Idea Name, Idea Description, Category, Status, Priority, Date Added, Objetives (linked). */
const TABLE = process.env.AIRTABLE_TABLE_DISCOVERY || 'Discovery Ideas'
const OBJECTIVES_FIELD = process.env.AIRTABLE_DISCOVERY_OBJECTIVES_FIELD || 'Objetives'

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
      res.statusCode = 200
      res.end(JSON.stringify({ deleted: recordId }))
    } catch (err) {
      console.error('discovery DELETE error:', err)
      res.statusCode = err.statusCode === 404 ? 404 : 500
      res.end(JSON.stringify({ error: err.message }))
    }
    return
  }

  if (recordId && req.method === 'PATCH') {
    const body = req.body || {}
    const fields = {}
    if (body['Idea Name'] != null && typeof body['Idea Name'] === 'string') fields['Idea Name'] = body['Idea Name'].trim()
    if (body['Idea Description'] != null && typeof body['Idea Description'] === 'string') fields['Idea Description'] = body['Idea Description'].trim()
    if (body.Category != null && typeof body.Category === 'string') fields.Category = body.Category.trim()
    if (body.Status != null && typeof body.Status === 'string') fields.Status = body.Status.trim()
    if (body.Priority != null && typeof body.Priority === 'string') fields.Priority = body.Priority.trim()
    if (body['Date Added'] != null) fields['Date Added'] = body['Date Added'] === '' ? null : String(body['Date Added']).trim()
    const objIds = body.Objectives ?? body.Objective ?? body.Objetives
    if (objIds !== undefined) {
      if (Array.isArray(objIds)) {
        fields[OBJECTIVES_FIELD] = objIds.filter((id) => typeof id === 'string' && id.trim())
      } else if (typeof objIds === 'string') {
        fields[OBJECTIVES_FIELD] = objIds.trim() ? [objIds.trim()] : []
      }
    }

    if (Object.keys(fields).length === 0) {
      res.statusCode = 400
      res.end(JSON.stringify({ error: 'Body must include at least one field to update' }))
      return
    }
    try {
      const updated = await updateRecord(TABLE, recordId, fields)
      res.statusCode = 200
      res.end(JSON.stringify({ data: updated }))
    } catch (err) {
      console.error('discovery PATCH error:', err)
      res.statusCode = err.statusCode === 404 ? 404 : 500
      res.end(JSON.stringify({ error: err.message }))
    }
    return
  }

  if (!recordId && req.method === 'POST') {
    const body = req.body || {}
    const name = body['Idea Name'] != null && typeof body['Idea Name'] === 'string' ? body['Idea Name'].trim() : ''
    if (!name) {
      res.statusCode = 400
      res.end(JSON.stringify({ error: 'Body must include Idea Name' }))
      return
    }
    const fields = { 'Idea Name': name }
    if (body['Idea Description'] != null && typeof body['Idea Description'] === 'string') fields['Idea Description'] = body['Idea Description'].trim()
    if (body.Category != null && typeof body.Category === 'string') fields.Category = body.Category.trim()
    if (body.Status != null && typeof body.Status === 'string') fields.Status = body.Status.trim()
    if (body.Priority != null && typeof body.Priority === 'string') fields.Priority = body.Priority.trim()
    if (body['Date Added'] != null) fields['Date Added'] = body['Date Added'] === '' ? null : String(body['Date Added']).trim()
    const objIds = body.Objectives ?? body.Objective ?? body.Objetives
    if (Array.isArray(objIds) && objIds.length > 0) {
      fields[OBJECTIVES_FIELD] = objIds.filter((id) => typeof id === 'string' && id.trim())
    } else if (typeof objIds === 'string' && objIds.trim()) {
      fields[OBJECTIVES_FIELD] = [objIds.trim()]
    }
    try {
      const created = await createRecord(TABLE, fields)
      res.statusCode = 201
      res.end(JSON.stringify({ data: created }))
    } catch (err) {
      console.error('discovery POST error:', err)
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
    const list = Array.isArray(data) ? data : []
    res.statusCode = 200
    res.end(JSON.stringify({ data: list }))
  } catch (err) {
    console.error('discovery GET error:', err)
    res.statusCode = 500
    res.end(JSON.stringify({ error: err.message }))
  }
}
