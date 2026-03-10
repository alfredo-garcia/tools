import { validateAccess } from '../../api/_lib/auth.js'
import { fetchTable, createRecord, updateRecord, deleteRecord, getRecipesBase, checkConflict } from '../../api/_lib/airtable.js'

const TABLE = process.env.AIRTABLE_TABLE_INGREDIENTS || 'Ingredients'

function getPathSegments(pathname) {
  return (pathname || '').replace(/^\/api/, '').split('/').filter(Boolean)
}

function parseBody(req) {
  if (req.body != null && typeof req.body === 'object') return req.body
  return {}
}

function mapIngredientFields(body) {
  const fields = {}
  if (body.Name != null && typeof body.Name === 'string') fields.Name = body.Name.trim()
  if (body['Name ES'] != null && typeof body['Name ES'] === 'string') fields['Name ES'] = body['Name ES'].trim()
  if (body.Description != null && typeof body.Description === 'string') fields.Description = body.Description.trim()
  if (body.Category != null && typeof body.Category === 'string') fields.Category = body.Category.trim()
  if (body.Unit != null && typeof body.Unit === 'string') fields.Unit = body.Unit.trim()
  if (body.Notes != null && typeof body.Notes === 'string') fields.Notes = body.Notes.trim()
  return fields
}

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json')
  const auth = validateAccess(req)
  if (!auth.valid) {
    res.statusCode = auth.status
    res.end(JSON.stringify(auth.body))
    return
  }
  const base = getRecipesBase()
  if (!base) {
    res.statusCode = 500
    res.end(JSON.stringify({ error: 'Airtable Recipes no configurado' }))
    return
  }

  const segments = getPathSegments(req.url)
  const recordId = segments[1]

  if (recordId && req.method === 'DELETE') {
    try {
      await deleteRecord(TABLE, recordId, base)
      res.statusCode = 200
      res.end(JSON.stringify({ deleted: recordId }))
    } catch (err) {
      console.error('ingredients DELETE error:', err)
      res.statusCode = err.statusCode === 404 ? 404 : 500
      res.end(JSON.stringify({ error: err.message }))
    }
    return
  }

  if (recordId && req.method === 'PATCH') {
    const body = parseBody(req)
    const clientLastModified = body.clientLastModified
    if (clientLastModified) {
      try {
        const conflict = await checkConflict(TABLE, recordId, clientLastModified, base)
        if (conflict.conflict) {
          res.statusCode = 409
          res.end(JSON.stringify({ error: 'Conflict', serverLastModified: conflict.serverLastModified }))
          return
        }
      } catch (err) {
        console.error('ingredients PATCH conflict check error:', err)
      }
    }
    const fields = mapIngredientFields(body)
    if (Object.keys(fields).length === 0) {
      res.statusCode = 400
      res.end(JSON.stringify({ error: 'Body must include at least one field to update' }))
      return
    }
    try {
      const updated = await updateRecord(TABLE, recordId, fields, base)
      res.statusCode = 200
      res.end(JSON.stringify({ data: updated }))
    } catch (err) {
      console.error('ingredients PATCH error:', err)
      res.statusCode = err.statusCode === 404 ? 404 : 500
      res.end(JSON.stringify({ error: err.message }))
    }
    return
  }

  if (!recordId && req.method === 'POST') {
    const body = parseBody(req)
    const name = body.Name != null && typeof body.Name === 'string' ? body.Name.trim() : ''
    const fields = { Name: name || '(untitled)', ...mapIngredientFields(body) }
    try {
      const created = await createRecord(TABLE, fields, base)
      res.statusCode = 201
      res.end(JSON.stringify({ data: created }))
    } catch (err) {
      console.error('ingredients POST error:', err)
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
    const data = await fetchTable(TABLE, 500, base)
    const list = Array.isArray(data) ? data : []
    res.statusCode = 200
    res.end(JSON.stringify({ data: list }))
  } catch (err) {
    console.error('ingredients GET error:', err)
    res.statusCode = 500
    res.end(JSON.stringify({ error: err.message }))
  }
}
