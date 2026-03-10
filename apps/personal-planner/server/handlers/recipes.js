import { validateAccess } from '../../api/_lib/auth.js'
import { fetchTable, createRecord, updateRecord, deleteRecord, getRecipesBase, checkConflict } from '../../api/_lib/airtable.js'

const TABLE = process.env.AIRTABLE_TABLE_RECIPES || 'Recipes'

function getPathSegments(pathname) {
  return (pathname || '').replace(/^\/api/, '').split('/').filter(Boolean)
}

function parseBody(req) {
  if (req.body != null && typeof req.body === 'object') return req.body
  return {}
}

function mapRecipeFields(body) {
  const fields = {}
  if (body.Name != null && typeof body.Name === 'string') fields.Name = body.Name.trim()
  if (body['Name ES'] != null && typeof body['Name ES'] === 'string') fields['Name ES'] = body['Name ES'].trim()
  if (body.Description != null && typeof body.Description === 'string') fields.Description = body.Description.trim()
  if (body['Meal Type'] !== undefined) {
    const mt = body['Meal Type']
    if (Array.isArray(mt)) {
      fields['Meal Type'] = mt.map((v) => String(v).trim()).filter(Boolean)
    } else if (typeof mt === 'string' && mt.trim()) {
      fields['Meal Type'] = [mt.trim()]
    } else {
      fields['Meal Type'] = []
    }
  }
  if (body['Cooking Process'] != null && typeof body['Cooking Process'] === 'string') fields['Cooking Process'] = body['Cooking Process'].trim()
  if (body['Complexity Rating'] != null) fields['Complexity Rating'] = typeof body['Complexity Rating'] === 'number' ? body['Complexity Rating'] : Number(body['Complexity Rating'])
  if (body['Nutrient Rating'] != null) fields['Nutrient Rating'] = typeof body['Nutrient Rating'] === 'number' ? body['Nutrient Rating'] : Number(body['Nutrient Rating'])
  if (body['Time to Cook (minutes)'] != null) fields['Time to Cook (minutes)'] = body['Time to Cook (minutes)'] === '' ? null : (typeof body['Time to Cook (minutes)'] === 'number' ? body['Time to Cook (minutes)'] : Number(body['Time to Cook (minutes)']))
  if (body.Servings != null) fields.Servings = body.Servings === '' ? null : (typeof body.Servings === 'number' ? body.Servings : Number(body.Servings))
  if (body['Cuisine Type'] != null && typeof body['Cuisine Type'] === 'string') fields['Cuisine Type'] = body['Cuisine Type'].trim()
  if (body['Source/URL'] != null && typeof body['Source/URL'] === 'string') fields['Source/URL'] = body['Source/URL'].trim()
  if (body.Tags != null && typeof body.Tags === 'string') fields.Tags = body.Tags.trim()
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
      console.error('recipes DELETE error:', err)
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
        console.error('recipes PATCH conflict check error:', err)
      }
    }
    const fields = mapRecipeFields(body)
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
      console.error('recipes PATCH error:', err)
      res.statusCode = err.statusCode === 404 ? 404 : 500
      res.end(JSON.stringify({ error: err.message }))
    }
    return
  }

  if (!recordId && req.method === 'POST') {
    const body = parseBody(req)
    const name = body.Name != null && typeof body.Name === 'string' ? body.Name.trim() : ''
    const fields = { Name: name || '(untitled)', ...mapRecipeFields(body) }
    try {
      const created = await createRecord(TABLE, fields, base)
      res.statusCode = 201
      res.end(JSON.stringify({ data: created }))
    } catch (err) {
      console.error('recipes POST error:', err)
      res.statusCode = err.statusCode === 404 ? 404 : 500
      res.end(JSON.stringify({ error: err.message }))
    }
    return
  }

  if (recordId && req.method === 'GET') {
    try {
      const data = await fetchTable(TABLE, 500, base)
      const list = Array.isArray(data) ? data : []
      const one = list.find((r) => r.id === recordId) || null
      if (!one) {
        res.statusCode = 404
        res.end(JSON.stringify({ error: 'Not found' }))
        return
      }
      res.statusCode = 200
      res.end(JSON.stringify({ data: one }))
    } catch (err) {
      console.error('recipes GET one error:', err)
      res.statusCode = 500
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
    console.error('recipes GET error:', err)
    res.statusCode = 500
    res.end(JSON.stringify({ error: err.message }))
  }
}
