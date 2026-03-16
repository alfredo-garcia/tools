/**
 * Airtable implementation of Shopping repository (Shopping List base).
 */
import { fetchTable, fetchRecord, createRecord, updateRecord, deleteRecord, checkConflict, getShoppingBase } from '../lib/airtable.js'

const TABLE = process.env.AIRTABLE_TABLE_SHOPPING || 'Shopping List'

function mapFields(body) {
  const fields = {}
  if (body.Name != null && typeof body.Name === 'string') fields.Name = body.Name.trim()
  if (body.Category != null && typeof body.Category === 'string') fields.Category = body.Category.trim()
  if (body.Description != null && typeof body.Description === 'string') fields.Description = body.Description.trim()
  if (body['Image (Web)'] != null && typeof body['Image (Web)'] === 'string') fields['Image (Web)'] = body['Image (Web)'].trim()
  if (body['Name ES'] != null && typeof body['Name ES'] === 'string') fields['Name ES'] = body['Name ES'].trim()
  if (body.Notes != null && typeof body.Notes === 'string') fields.Notes = body.Notes.trim()
  if (body.Priority != null && typeof body.Priority === 'string') fields.Priority = body.Priority.trim()
  if (body.Quantity != null) fields.Quantity = body.Quantity === '' ? null : (typeof body.Quantity === 'number' ? body.Quantity : Number(body.Quantity))
  if (body.Status != null && typeof body.Status === 'string') fields.Status = body.Status.trim()
  if (body.Store != null && typeof body.Store === 'string') fields.Store = body.Store.trim()
  if (body.Unit != null && typeof body.Unit === 'string') fields.Unit = body.Unit.trim()
  return fields
}

function getBase() {
  const base = getShoppingBase()
  if (!base) throw new Error('Airtable Shopping not configured')
  return base
}

/** @returns {import('../interfaces.js').ShoppingRepository} */
export function createAirtableShoppingRepository() {
  return {
    async list() {
      const data = await fetchTable(TABLE, 500, getBase())
      return Array.isArray(data) ? data : []
    },

    async getById(id) {
      return await fetchRecord(TABLE, id, getBase())
    },

    async create(fields) {
      const name = (fields.Name != null && typeof fields.Name === 'string') ? fields.Name.trim() : ''
      const body = { Name: name || '(untitled)', ...mapFields(fields) }
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
