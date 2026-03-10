import { validateAccess } from '../../api/_lib/auth.js'
import { fetchTable, createRecord, updateRecord, deleteRecord, checkConflict } from '../../api/_lib/airtable.js'

const TABLE = process.env.AIRTABLE_TABLE_KEY_RESULTS || 'Key Results'

/** Normaliza los estados de Key Result que puede enviar el frontend a los valores del Single select en Airtable. */
const STATUS_TO_AIRTABLE = {
  // Nuevos valores válidos
  'Not Started': 'Not Started',
  'In Progress': 'In Progress',
  Achieved: 'Achieved',
  Behind: 'Behind',
  Missed: 'Missed',
  // Sinónimos antiguos para compatibilidad
  Pending: 'Not Started',
  Todo: 'Not Started',
  TODO: 'Not Started',
  Done: 'Achieved',
}

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
    const clientLastModified = body.clientLastModified
    if (clientLastModified) {
      try {
        const conflict = await checkConflict(TABLE, recordId, clientLastModified)
        if (conflict.conflict) {
          res.statusCode = 409
          res.end(JSON.stringify({ error: 'Conflict', serverLastModified: conflict.serverLastModified }))
          return
        }
      } catch (err) {
        console.error('key-results PATCH conflict check error:', err)
      }
    }
    const fields = {}
    if (body.Status != null && typeof body.Status === 'string') {
      const raw = body.Status.trim()
      fields.Status = STATUS_TO_AIRTABLE[raw] ?? raw
    }
    if (body['Key Result Name'] != null && typeof body['Key Result Name'] === 'string') fields['Key Result Name'] = body['Key Result Name'].trim()
    if (body.Description != null && typeof body.Description === 'string') fields.Description = body.Description.trim()
    if (body.Metric != null && typeof body.Metric === 'string') fields.Metric = body.Metric.trim()
    if (body['Current Value'] != null) {
      const v = body['Current Value']
      fields['Current Value'] = v === '' ? null : (typeof v === 'number' && !Number.isNaN(v) ? v : Number(v))
      if (fields['Current Value'] !== null && Number.isNaN(fields['Current Value'])) fields['Current Value'] = null
    }
    if (body['Target Value'] != null) {
      const v = body['Target Value']
      fields['Target Value'] = v === '' ? null : (typeof v === 'number' && !Number.isNaN(v) ? v : Number(v))
      if (fields['Target Value'] !== null && Number.isNaN(fields['Target Value'])) fields['Target Value'] = null
    }
    if (body.Unit != null && typeof body.Unit === 'string') fields.Unit = body.Unit.trim()
    if (body.Deadline != null) fields.Deadline = body.Deadline === '' ? null : String(body.Deadline).trim()
    if (body['Progress (%)'] != null) fields['Progress (%)'] = body['Progress (%)'] === '' ? null : Number(body['Progress (%)'])
    const objectiveId = body['Objective Link'] ?? body.Objective
    if (objectiveId !== undefined) {
      if (Array.isArray(objectiveId) && objectiveId.length > 0 && objectiveId[0]) {
        fields['Objective Link'] = [String(objectiveId[0]).trim()]
      } else if (typeof objectiveId === 'string' && objectiveId.trim()) {
        fields['Objective Link'] = [objectiveId.trim()]
      } else {
        fields['Objective Link'] = []
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
    const requestedStatus =
      body.Status != null && typeof body.Status === 'string'
        ? body.Status.trim()
        : null
    const normalizedStatus =
      (requestedStatus && (STATUS_TO_AIRTABLE[requestedStatus] ?? requestedStatus)) ||
      'Not Started'
    const fields = {
      'Key Result Name': name,
      Status: normalizedStatus,
    }
    const objectiveId = body['Objective Link'] ?? body.Objective
    if (Array.isArray(objectiveId) && objectiveId.length > 0 && objectiveId[0]) {
      fields['Objective Link'] = [String(objectiveId[0]).trim()]
    } else if (typeof objectiveId === 'string' && objectiveId.trim()) {
      fields['Objective Link'] = [objectiveId.trim()]
    }
    if (body.Description != null && typeof body.Description === 'string') fields.Description = body.Description.trim()
    if (body.Metric != null && typeof body.Metric === 'string') fields.Metric = body.Metric.trim()
    if (body['Current Value'] != null) {
      const v = body['Current Value']
      fields['Current Value'] = v === '' ? null : (typeof v === 'number' && !Number.isNaN(v) ? v : Number(v))
      if (fields['Current Value'] !== null && Number.isNaN(fields['Current Value'])) fields['Current Value'] = null
    }
    if (body['Target Value'] != null) {
      const v = body['Target Value']
      fields['Target Value'] = v === '' ? null : (typeof v === 'number' && !Number.isNaN(v) ? v : Number(v))
      if (fields['Target Value'] !== null && Number.isNaN(fields['Target Value'])) fields['Target Value'] = null
    }
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
