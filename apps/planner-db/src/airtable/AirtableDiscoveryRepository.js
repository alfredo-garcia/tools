/**
 * Airtable implementation of Discovery (ideas backlog) repository.
 * Table: Discovery Ideas — Idea Name, Idea Description, Category, Status, Priority, Date Added, Objetives (linked).
 */
import { fetchTable, fetchRecord, createRecord, updateRecord, deleteRecord, checkConflict } from '../lib/airtable.js'

const TABLE = process.env.AIRTABLE_TABLE_DISCOVERY || 'Discovery Ideas'
const OBJECTIVES_FIELD = process.env.AIRTABLE_DISCOVERY_OBJECTIVES_FIELD || 'Objetives'

function mapFields(body) {
  const fields = {}
  if (body['Idea Name'] != null && typeof body['Idea Name'] === 'string') fields['Idea Name'] = body['Idea Name'].trim()
  if (body['Idea Description'] != null && typeof body['Idea Description'] === 'string') fields['Idea Description'] = body['Idea Description'].trim()
  if (body.Category != null && typeof body.Category === 'string') fields.Category = body.Category.trim()
  if (body.Status != null && typeof body.Status === 'string') fields.Status = body.Status.trim()
  if (body.Priority != null && typeof body.Priority === 'string') fields.Priority = body.Priority.trim()
  if (body['Date Added'] != null) fields['Date Added'] = body['Date Added'] === '' ? null : String(body['Date Added']).trim()
  const objIds = body.Objectives ?? body.Objective ?? body.Objetives
  if (objIds !== undefined) {
    if (Array.isArray(objIds)) {
      fields[OBJECTIVES_FIELD] = objIds.filter((id) => typeof id === 'string' && id.trim())
    } else if (typeof objIds === 'string') {
      fields[OBJECTIVES_FIELD] = objIds.trim() ? [objIds.trim()] : []
    }
  }
  return fields
}

/** @returns {import('../interfaces.js').DiscoveryRepository} */
export function createAirtableDiscoveryRepository() {
  return {
    async list() {
      const data = await fetchTable(TABLE)
      return Array.isArray(data) ? data : []
    },

    async getById(id) {
      return await fetchRecord(TABLE, id)
    },

    async create(fields) {
      const name = (fields['Idea Name'] != null && typeof fields['Idea Name'] === 'string') ? fields['Idea Name'].trim() : ''
      if (!name) throw new Error('Idea Name is required')
      const body = { 'Idea Name': name, ...mapFields(fields) }
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
