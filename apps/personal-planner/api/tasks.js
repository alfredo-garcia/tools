import { validateAccess } from './_lib/auth.js'
import { fetchTable, createRecord, updateRecord, deleteRecord } from './_lib/airtable.js'

const TABLE = process.env.AIRTABLE_TABLE_TASKS || 'Tasks'

/** Mapeo de valores que envía el frontend a opciones del Single Select en Airtable (evita INVALID_MULTIPLE_CHOICE_OPTIONS). */
const STATUS_TO_AIRTABLE = {
  Pending: 'Todo',
  'In Progress': 'In Progress',
  Done: 'Done',
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
      console.error('tasks DELETE error:', err)
      res.statusCode = err.statusCode === 404 ? 404 : 500
      res.end(JSON.stringify({ error: err.message }))
    }
    return
  }

  if (recordId && req.method === 'PATCH') {
    const body = req.body || {}
    const fields = {}
    if (body.Status != null && typeof body.Status === 'string') {
      const value = body.Status.trim()
      fields.Status = STATUS_TO_AIRTABLE[value] ?? value
    }
    if (body['Task Name'] != null && typeof body['Task Name'] === 'string') fields['Task Name'] = body['Task Name'].trim()
    if (body.Description != null && typeof body.Description === 'string') fields.Description = body.Description.trim()
    if (body['Due Date'] != null) fields['Due Date'] = body['Due Date'] === '' ? null : String(body['Due Date']).trim()
    if (body.Priority != null && typeof body.Priority === 'string') fields.Priority = body.Priority.trim()
    if (body.Assignee != null && typeof body.Assignee === 'string') fields.Assignee = body.Assignee.trim()
    if (body.Category != null && typeof body.Category === 'string') fields.Category = body.Category.trim()

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
      console.error('tasks PATCH error:', err)
      res.statusCode = err.statusCode === 404 ? 404 : 500
      res.end(JSON.stringify({ error: err.message }))
    }
    return
  }

  if (!recordId && req.method === 'POST') {
    const body = req.body || {}
    const name = body['Task Name'] != null && typeof body['Task Name'] === 'string' ? body['Task Name'].trim() : ''
    if (!name) {
      res.statusCode = 400
      res.end(JSON.stringify({ error: 'Body must include Task Name' }))
      return
    }
    const fields = { 'Task Name': name }
    if (body.Description != null && typeof body.Description === 'string') fields.Description = body.Description.trim()
    if (body['Due Date'] != null) fields['Due Date'] = body['Due Date'] === '' ? null : String(body['Due Date']).trim()
    if (body.Priority != null && typeof body.Priority === 'string') fields.Priority = body.Priority.trim()
    if (body.Status != null && typeof body.Status === 'string') {
      const value = body.Status.trim()
      fields.Status = STATUS_TO_AIRTABLE[value] ?? value
    }
    if (body.Assignee != null && typeof body.Assignee === 'string') fields.Assignee = body.Assignee.trim()
    if (body.Category != null && typeof body.Category === 'string') fields.Category = body.Category.trim()
    const krIds = body['Key Results'] ?? body['Key Result']
    if (Array.isArray(krIds) && krIds.length > 0) {
      fields['Key Results'] = krIds.filter((id) => typeof id === 'string' && id.trim())
    } else if (typeof krIds === 'string' && krIds.trim()) {
      fields['Key Results'] = [krIds.trim()]
    }
    const objIds = body.Objectives ?? body.Objective
    if (Array.isArray(objIds) && objIds.length > 0) {
      fields.Objectives = objIds.filter((id) => typeof id === 'string' && id.trim())
    } else if (typeof objIds === 'string' && objIds.trim()) {
      fields.Objectives = [objIds.trim()]
    }
    try {
      const created = await createRecord(TABLE, fields)
      res.statusCode = 201
      res.end(JSON.stringify({ data: created }))
    } catch (err) {
      console.error('tasks POST error:', err)
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
    console.error('tasks error:', err)
    res.statusCode = 500
    res.end(JSON.stringify({ error: err.message }))
  }
}
