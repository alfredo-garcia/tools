/**
 * Airtable implementation of Recipes repository (Recipes base).
 */
import { fetchTable, fetchRecord, createRecord, updateRecord, deleteRecord, checkConflict, getRecipesBase } from '../lib/airtable.js'

const TABLE = process.env.AIRTABLE_TABLE_RECIPES || 'Recipes'

function mapFields(body) {
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

function getBase() {
  const base = getRecipesBase()
  if (!base) throw new Error('Airtable Recipes not configured')
  return base
}

/** @returns {import('../interfaces.js').RecipesRepository} */
export function createAirtableRecipesRepository() {
  return {
    async list() {
      const data = await fetchTable(TABLE, 500, getBase())
      return Array.isArray(data) ? data : []
    },

    async getById(id) {
      return await fetchRecord(TABLE, id, getBase())
    },

    async create(fields) {
      const body = mapFields(fields)
      if (!body.Name) throw new Error('Name is required')
      return await createRecord(TABLE, body, getBase())
    },

    async update(id, fields, opts = {}) {
      if (opts.clientLastModified) {
        const conflict = await checkConflict(TABLE, id, opts.clientLastModified, getBase())
        if (conflict.conflict) {
          const err = new Error('Conflict')
          err.statusCode = 409
          err.serverLastModified = conflict.serverLastModified
          throw err
        }
      }
      const mapped = mapFields(fields)
      if (Object.keys(mapped).length === 0) throw new Error('At least one field to update is required')
      return await updateRecord(TABLE, id, mapped, getBase())
    },

    async delete(id) {
      await deleteRecord(TABLE, id, getBase())
    },
  }
}
