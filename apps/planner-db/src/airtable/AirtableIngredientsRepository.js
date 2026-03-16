/**
 * Airtable implementation of Ingredients repository (Recipes base).
 */
import { fetchTable, fetchRecord, createRecord, updateRecord, deleteRecord, checkConflict, getRecipesBase } from '../lib/airtable.js'

const TABLE = process.env.AIRTABLE_TABLE_INGREDIENTS || 'Ingredients'

function mapFields(body) {
  const fields = {}
  if (body.Name != null && typeof body.Name === 'string') fields.Name = body.Name.trim()
  if (body['Name ES'] != null && typeof body['Name ES'] === 'string') fields['Name ES'] = body['Name ES'].trim()
  if (body.Description != null && typeof body.Description === 'string') fields.Description = body.Description.trim()
  if (body.Category != null && typeof body.Category === 'string') fields.Category = body.Category.trim()
  if (body.Unit != null && typeof body.Unit === 'string') fields.Unit = body.Unit.trim()
  if (body.Notes != null && typeof body.Notes === 'string') fields.Notes = body.Notes.trim()
  return fields
}

function getBase() {
  const base = getRecipesBase()
  if (!base) throw new Error('Airtable Recipes not configured')
  return base
}

/** @returns {import('../interfaces.js').IngredientsRepository} */
export function createAirtableIngredientsRepository() {
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
