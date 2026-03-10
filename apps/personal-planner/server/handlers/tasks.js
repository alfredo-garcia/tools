import { validateAccess } from '../../api/_lib/auth.js'
import { fetchTable, createRecord, updateRecord, deleteRecord, checkConflict } from '../../api/_lib/airtable.js'

const TABLE = process.env.AIRTABLE_TABLE_TASKS || 'Tasks'
/** Nombre del campo link a Key Results en la tabla Tasks de Airtable (p. ej. "Key Result" o "Key Results"). */
const TASKS_KR_FIELD = process.env.AIRTABLE_TASKS_KR_FIELD || 'Key Result'

/** Mapeo de valores que envía el frontend a opciones del Single Select en Airtable (evita INVALID_MULTIPLE_CHOICE_OPTIONS). */
const STATUS_TO_AIRTABLE = {
  Pending: 'Todo',
  'In Progress': 'In Progress',
  Done: 'Done',
}

function getPathSegments(pathname) {
  return (pathname || '').replace(/^\/api/, '').split('/').filter(Boolean)
}

/** Quita de la respuesta campos que Airtable devuelve en estado error (ej. Task Summary (AI)) para no exponer errores internos en Network. */
function sanitizeTaskRecord(record) {
  if (!record || typeof record !== 'object') return record
  const key = 'Task Summary (AI)'
  if (record[key] != null && typeof record[key] === 'object' && record[key].state === 'error') {
    const out = { ...record }
    delete out[key]
    return out
  }
  return record
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
        console.error('tasks PATCH conflict check error:', err)
      }
    }
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
    const krIds = body['Key Results'] ?? body['Key Result']
    if (krIds !== undefined) {
      if (Array.isArray(krIds)) {
        fields[TASKS_KR_FIELD] = krIds.filter((id) => typeof id === 'string' && id.trim())
      } else if (typeof krIds === 'string') {
        fields[TASKS_KR_FIELD] = krIds.trim() ? [krIds.trim()] : []
      }
    }

    if (Object.keys(fields).length === 0) {
      res.statusCode = 400
      res.end(JSON.stringify({ error: 'Body must include at least one field to update' }))
      return
    }
    try {
      let updated = await updateRecord(TABLE, recordId, fields)
      res.statusCode = 200
      res.end(JSON.stringify({ data: sanitizeTaskRecord(updated) }))
    } catch (err) {
      const msg = String(err.message || '')
      const isSelectOptionError = /Insufficient permissions to create new select option/i.test(msg) ||
        /INVALID_MULTIPLE_CHOICE/i.test(msg)
      if (isSelectOptionError && fields.Category !== undefined) {
        const fieldsWithoutCategory = { ...fields }
        delete fieldsWithoutCategory.Category
        if (Object.keys(fieldsWithoutCategory).length > 0) {
          try {
            const updated = await updateRecord(TABLE, recordId, fieldsWithoutCategory)
            res.statusCode = 200
            res.end(JSON.stringify({
              data: sanitizeTaskRecord(updated),
              warning: 'Category was not updated: value is not an existing option in Airtable (or token cannot create options). Add the option in Airtable or use an existing one.',
            }))
            return
          } catch (retryErr) {
            console.error('tasks PATCH retry error:', retryErr)
          }
        } else {
          // Only Category was being updated; avoid 500 so the client can refetch and stay in sync
          res.statusCode = 200
          res.end(JSON.stringify({
            data: null,
            warning: 'Category was not updated: value is not an existing option in Airtable (or token cannot create options). Use a category that already exists in your Airtable Category field.',
          }))
          return
        }
      }
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
      fields[TASKS_KR_FIELD] = krIds.filter((id) => typeof id === 'string' && id.trim())
    } else if (typeof krIds === 'string' && krIds.trim()) {
      fields[TASKS_KR_FIELD] = [krIds.trim()]
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
      res.end(JSON.stringify({ data: sanitizeTaskRecord(created) }))
    } catch (err) {
      const msg = String(err.message || '')
      const isSelectOptionError = /Insufficient permissions to create new select option/i.test(msg) ||
        /INVALID_MULTIPLE_CHOICE/i.test(msg)
      if (isSelectOptionError && fields.Category !== undefined) {
        const fieldsWithoutCategory = { ...fields }
        delete fieldsWithoutCategory.Category
        try {
          const created = await createRecord(TABLE, fieldsWithoutCategory)
          res.statusCode = 201
          res.end(JSON.stringify({
            data: sanitizeTaskRecord(created),
            warning: 'Category was not set: value is not an existing option in Airtable (or token cannot create options). Add the option in Airtable or use an existing one.',
          }))
          return
        } catch (retryErr) {
          console.error('tasks POST retry error:', retryErr)
        }
      }
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
    const raw = await fetchTable(TABLE)
    const data = Array.isArray(raw) ? raw.map(sanitizeTaskRecord) : raw
    res.statusCode = 200
    res.end(JSON.stringify({ data }))
  } catch (err) {
    console.error('tasks error:', err)
    res.statusCode = 500
    res.end(JSON.stringify({ error: err.message }))
  }
}
