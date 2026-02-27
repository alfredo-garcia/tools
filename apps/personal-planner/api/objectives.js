import { validateAccess } from './_lib/auth.js'
import { fetchTable, createRecord, updateRecord, deleteRecord } from './_lib/airtable.js'

const TABLE = process.env.AIRTABLE_TABLE_OBJECTIVES || 'Objectives'

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
      console.error('objectives DELETE error:', err)
      res.statusCode = err.statusCode === 404 ? 404 : 500
      res.end(JSON.stringify({ error: err.message }))
    }
    return
  }

  if (recordId && req.method === 'PATCH') {
    const body = req.body || {}
    const fields = {}
    if (body.Status != null && typeof body.Status === 'string') fields.Status = body.Status.trim()
    if (body['Objective Name'] != null && typeof body['Objective Name'] === 'string') fields['Objective Name'] = body['Objective Name'].trim()
    if (body.Description != null && typeof body.Description === 'string') fields.Description = body.Description.trim()
    if (body.Category != null && typeof body.Category === 'string') fields.Category = body.Category.trim()
    if (body.Priority != null && typeof body.Priority === 'string') fields.Priority = body.Priority.trim()
    if (body['Start Date'] != null) fields['Start Date'] = body['Start Date'] === '' ? null : String(body['Start Date']).trim()
    if (body['Target Date'] != null) fields['Target Date'] = body['Target Date'] === '' ? null : String(body['Target Date']).trim()

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
      console.error('objectives PATCH error:', err)
      res.statusCode = err.statusCode === 404 ? 404 : 500
      res.end(JSON.stringify({ error: err.message }))
    }
    return
  }

  if (!recordId && req.method === 'POST') {
    const body = req.body || {}
    const name = body['Objective Name'] != null && typeof body['Objective Name'] === 'string' ? body['Objective Name'].trim() : ''
    if (!name) {
      res.statusCode = 400
      res.end(JSON.stringify({ error: 'Body must include Objective Name' }))
      return
    }
    const fields = {
      'Objective Name': name,
      Status: (body.Status != null && typeof body.Status === 'string' ? body.Status.trim() : null) || 'Pending',
    }
    if (body.Description != null && typeof body.Description === 'string') fields.Description = body.Description.trim()
    if (body.Category != null && typeof body.Category === 'string') fields.Category = body.Category.trim()
    if (body.Priority != null && typeof body.Priority === 'string') fields.Priority = body.Priority.trim()
    if (body['Start Date'] != null) fields['Start Date'] = body['Start Date'] === '' ? null : String(body['Start Date']).trim()
    if (body['Target Date'] != null) fields['Target Date'] = body['Target Date'] === '' ? null : String(body['Target Date']).trim()
    try {
      const created = await createRecord(TABLE, fields)
      res.statusCode = 201
      res.end(JSON.stringify({ data: created }))
    } catch (err) {
      console.error('objectives POST error:', err)
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
    console.error('objectives error:', err)
    res.statusCode = 500
    res.end(JSON.stringify({ error: err.message }))
  }
}
