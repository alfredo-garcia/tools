import { validateAccess } from '../../api/_lib/auth.js'
import { fetchTable, createRecord, updateRecord, deleteRecord, getRecipesBase } from '../../api/_lib/airtable.js'

const TABLE = process.env.AIRTABLE_TABLE_RECIPE_INGREDIENTS || 'Recipe Ingredients'

function getPathSegments(pathname) {
  return (pathname || '').replace(/^\/api/, '').split('/').filter(Boolean)
}

function parseBody(req) {
  if (req.body != null && typeof req.body === 'object') return req.body
  return {}
}

/** Airtable link fields expect arrays of record IDs. */
function mapRecipeIngredientFields(body) {
  const fields = {}
  if (body.Recipe != null) {
    const v = body.Recipe
    fields.Recipe = Array.isArray(v) ? v : [v].filter(Boolean)
  }
  if (body.Ingredient != null) {
    const v = body.Ingredient
    fields.Ingredient = Array.isArray(v) ? v : [v].filter(Boolean)
  }
  if (body.Quantity != null) fields.Quantity = body.Quantity === '' ? null : (typeof body.Quantity === 'number' ? body.Quantity : Number(body.Quantity))
  if (body.Unit != null && typeof body.Unit === 'string') fields.Unit = body.Unit.trim()
  if (body['Optional Ingredient'] != null) fields['Optional Ingredient'] = Boolean(body['Optional Ingredient'])
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
      console.error('recipe-ingredients DELETE error:', err)
      res.statusCode = err.statusCode === 404 ? 404 : 500
      res.end(JSON.stringify({ error: err.message }))
    }
    return
  }

  if (recordId && req.method === 'PATCH') {
    const body = parseBody(req)
    const fields = mapRecipeIngredientFields(body)
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
      console.error('recipe-ingredients PATCH error:', err)
      res.statusCode = err.statusCode === 404 ? 404 : 500
      res.end(JSON.stringify({ error: err.message }))
    }
    return
  }

  if (!recordId && req.method === 'POST') {
    const body = parseBody(req)
    const recipeId = body.Recipe != null ? (Array.isArray(body.Recipe) ? body.Recipe[0] : body.Recipe) : null
    const ingredientId = body.Ingredient != null ? (Array.isArray(body.Ingredient) ? body.Ingredient[0] : body.Ingredient) : null
    if (!recipeId || !ingredientId) {
      res.statusCode = 400
      res.end(JSON.stringify({ error: 'Body must include Recipe and Ingredient (record IDs)' }))
      return
    }
    const fields = {
      Recipe: [recipeId],
      Ingredient: [ingredientId],
      ...mapRecipeIngredientFields(body),
    }
    try {
      const created = await createRecord(TABLE, fields, base)
      res.statusCode = 201
      res.end(JSON.stringify({ data: created }))
    } catch (err) {
      console.error('recipe-ingredients POST error:', err)
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
    console.error('recipe-ingredients GET error:', err)
    res.statusCode = 500
    res.end(JSON.stringify({ error: err.message }))
  }
}
