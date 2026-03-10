import { validateAccess } from '../../api/_lib/auth.js'
import { fetchTable, createRecord, updateRecord, deleteRecord, checkConflict } from '../../api/_lib/airtable.js'

const TABLE = process.env.AIRTABLE_TABLE_MEALS || 'Meals'

const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner', 'Sauce', 'Dessert', 'Snack', 'Tapa']

function getPathSegments(pathname) {
  return (pathname || '').replace(/^\/api/, '').split('/').filter(Boolean)
}

function parseBody(req) {
  if (req.body != null && typeof req.body === 'object') return req.body
  return {}
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
      console.error('meals DELETE error:', err)
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
        const conflict = await checkConflict(TABLE, recordId, clientLastModified)
        if (conflict.conflict) {
          res.statusCode = 409
          res.end(JSON.stringify({ error: 'Conflict', serverLastModified: conflict.serverLastModified }))
          return
        }
      } catch (err) {
        console.error('meals PATCH conflict check error:', err)
      }
    }
    const fields = {}
    if (body['Meal Type'] != null && MEAL_TYPES.includes(String(body['Meal Type']).trim())) {
      fields['Meal Type'] = String(body['Meal Type']).trim()
    }
    if (body.Date != null && /^\d{4}-\d{2}-\d{2}/.test(String(body.Date))) {
      fields.Date = String(body.Date).slice(0, 10)
    }
    if (body.Meal != null && typeof body.Meal === 'string') {
      fields.Meal = body.Meal.trim() || null
    }
    if (Object.keys(fields).length === 0) {
      res.statusCode = 400
      res.end(JSON.stringify({ error: 'Body must include at least one field to update (Meal Type, Date, Meal/Recipe)' }))
      return
    }
    try {
      const updated = await updateRecord(TABLE, recordId, fields)
      res.statusCode = 200
      res.end(JSON.stringify({ data: updated }))
    } catch (err) {
      console.error('meals PATCH error:', err)
      res.statusCode = err.statusCode === 404 ? 404 : 500
      res.end(JSON.stringify({ error: err.message }))
    }
    return
  }

  if (!recordId && req.method === 'POST') {
    const body = parseBody(req)
    const mealType = body['Meal Type'] != null && MEAL_TYPES.includes(String(body['Meal Type']).trim())
      ? String(body['Meal Type']).trim()
      : null
    const date = body.Date != null && /^\d{4}-\d{2}-\d{2}/.test(String(body.Date)) ? String(body.Date).slice(0, 10) : null
    const recipeId = (body.Meal != null ? String(body.Meal).trim() : null) || (body.Recipe != null ? String(body.Recipe).trim() : null)
    if (!mealType || !date) {
      res.statusCode = 400
      res.end(JSON.stringify({ error: 'Meal Type and Date are required' }))
      return
    }
    const fields = { 'Meal Type': mealType, Date: date }
    if (recipeId) fields.Meal = recipeId
    try {
      const created = await createRecord(TABLE, fields)
      res.statusCode = 201
      res.end(JSON.stringify({ data: created }))
    } catch (err) {
      console.error('meals POST error:', err)
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
    const data = await fetchTable(TABLE, 500)
    const list = Array.isArray(data) ? data : []
    res.statusCode = 200
    res.end(JSON.stringify({ data: list }))
  } catch (err) {
    console.error('meals GET error:', err)
    res.statusCode = 500
    res.end(JSON.stringify({ error: err.message }))
  }
}
