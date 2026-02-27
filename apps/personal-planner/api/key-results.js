import { validateAccess } from './_lib/auth.js'
import { fetchTable, createRecord, updateRecord, deleteRecord } from './_lib/airtable.js'

const TABLE = process.env.AIRTABLE_TABLE_KEY_RESULTS || 'Key Results'

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
      console.error('key-results DELETE error:', err)
      res.statusCode = err.statusCode === 404 ? 404 : 500
      res.end(JSON.stringify({ error: err.message }))
    }
    return
  }

  if (recordId && req.method === 'PATCH') {
    const body = req.body || {}
    const fields = {}
    if (body.Status != null && typeof body.Status === 'string') fields.Status = body.Status.trim()
    if (body['Key Result Name'] != null && typeof body['Key Result Name'] === 'string') fields['Key Result Name'] = body['Key Result Name'].trim()
    if (body.Description != null && typeof body.Description === 'string') fields.Description = body.Description.trim()
    if (body.Metric != null && typeof body.Metric === 'string') fields.Metric = body.Metric.trim()
    if (body['Current Value'] != null) fields['Current Value'] = body['Current Value'] === '' ? null : body['Current Value']
    if (body['Target Value'] != null) fields['Target Value'] = body['Target Value'] === '' ? null : body['Target Value']
    if (body.Unit != null && typeof body.Unit === 'string') fields.Unit = body.Unit.trim()
    if (body.Deadline != null) fields.Deadline = body.Deadline === '' ? null : String(body.Deadline).trim()
    if (body['Progress (%)'] != null) fields['Progress (%)'] = body['Progress (%)'] === '' ? null : Number(body['Progress (%)'])

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
      console.error('key-results PATCH error:', err)
      res.statusCode = err.statusCode === 404 ? 404 : 500
      res.end(JSON.stringify({ error: err.message }))
    }
    return
  }

  if (!recordId && req.method === 'POST') {
    const body = req.body || {}
    const name = body['Key Result Name'] != null && typeof body['Key Result Name'] === 'string' ? body['Key Result Name'].trim() : ''
    if (!name) {
      res.statusCode = 400
      res.end(JSON.stringify({ error: 'Body must include Key Result Name' }))
      return
    }
    const fields = {
      'Key Result Name': name,
      Status: (body.Status != null && typeof body.Status === 'string' ? body.Status.trim() : null) || 'Pending',
    }
    const objectiveId = body['Objective Link'] ?? body.Objective
    if (Array.isArray(objectiveId) && objectiveId.length > 0 && objectiveId[0]) {
      fields['Objective Link'] = [String(objectiveId[0]).trim()]
    } else if (typeof objectiveId === 'string' && objectiveId.trim()) {
      fields['Objective Link'] = [objectiveId.trim()]
    }
    if (body.Description != null && typeof body.Description === 'string') fields.Description = body.Description.trim()
    if (body.Metric != null && typeof body.Metric === 'string') fields.Metric = body.Metric.trim()
    if (body['Current Value'] != null) fields['Current Value'] = body['Current Value'] === '' ? null : body['Current Value']
    if (body['Target Value'] != null) fields['Target Value'] = body['Target Value'] === '' ? null : body['Target Value']
    if (body.Unit != null && typeof body.Unit === 'string') fields.Unit = body.Unit.trim()
    if (body.Deadline != null) fields.Deadline = body.Deadline === '' ? null : String(body.Deadline).trim()
    if (body['Progress (%)'] != null) fields['Progress (%)'] = body['Progress (%)'] === '' ? null : Number(body['Progress (%)'])
    try {
      const created = await createRecord(TABLE, fields)
      res.statusCode = 201
      res.end(JSON.stringify({ data: created }))
    } catch (err) {
      console.error('key-results POST error:', err)
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
    console.error('key-results error:', err)
    res.statusCode = 500
    res.end(JSON.stringify({ error: err.message }))
  }
}
