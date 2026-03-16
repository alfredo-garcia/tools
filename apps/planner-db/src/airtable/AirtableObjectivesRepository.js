/**
 * Airtable implementation of Objectives repository.
 */
import { fetchTable, fetchRecord, createRecord, updateRecord, deleteRecord, checkConflict } from '../lib/airtable.js'

const TABLE = process.env.AIRTABLE_TABLE_OBJECTIVES || 'Objectives'

function mapFields(body) {
  const fields = {}
  if (body.Status != null && typeof body.Status === 'string') fields.Status = body.Status.trim()
  if (body['Objective Name'] != null && typeof body['Objective Name'] === 'string') fields['Objective Name'] = body['Objective Name'].trim()
  if (body.Description != null && typeof body.Description === 'string') fields.Description = body.Description.trim()
  if (body.Category != null && typeof body.Category === 'string') fields.Category = body.Category.trim()
  if (body.Priority != null && typeof body.Priority === 'string') fields.Priority = body.Priority.trim()
  if (body['Start Date'] != null) fields['Start Date'] = body['Start Date'] === '' ? null : String(body['Start Date']).trim()
  if (body['Target Date'] != null) fields['Target Date'] = body['Target Date'] === '' ? null : String(body['Target Date']).trim()
  return fields
}

/** @returns {import('../interfaces.js').ObjectivesRepository} */
export function createAirtableObjectivesRepository() {
  return {
    async list() {
      const data = await fetchTable(TABLE)
      return Array.isArray(data) ? data : []
    },

    async getById(id) {
      return await fetchRecord(TABLE, id)
    },

    async create(fields) {
      const name = (fields['Objective Name'] != null && typeof fields['Objective Name'] === 'string') ? fields['Objective Name'].trim() : ''
      if (!name) throw new Error('Objective Name is required')
      const body = { 'Objective Name': name, Status: (fields.Status != null && typeof fields.Status === 'string' ? fields.Status.trim() : null) || 'Pending', ...mapFields(fields) }
      return await createRecord(TABLE, body)
    },

    async update(id, fields, opts = {}) {
      if (opts.clientLastModified) {
        const conflict = await checkConflict(TABLE, id, opts.clientLastModified)
        if (conflict.conflict) {
          const err = new Error('Conflict')
          err.statusCode = 409
          err.serverLastModified = conflict.serverLastModified
          throw err
        }
      }
      const mapped = mapFields(fields)
      if (Object.keys(mapped).length === 0) throw new Error('At least one field to update is required')
      return await updateRecord(TABLE, id, mapped)
    },

    async delete(id) {
      await deleteRecord(TABLE, id)
    },
  }
}
