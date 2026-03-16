/**
 * Airtable implementation of Key Results repository.
 */
import { fetchTable, fetchRecord, createRecord, updateRecord, deleteRecord, checkConflict } from '../lib/airtable.js'

const TABLE = process.env.AIRTABLE_TABLE_KEY_RESULTS || 'Key Results'

const STATUS_TO_AIRTABLE = {
  'Not Started': 'Not Started',
  'In Progress': 'In Progress',
  Achieved: 'Achieved',
  Behind: 'Behind',
  Missed: 'Missed',
  Pending: 'Not Started',
  Todo: 'Not Started',
  TODO: 'Not Started',
  Done: 'Achieved',
}

function mapFields(body, forCreate = false) {
  const fields = {}
  if (body.Status != null && typeof body.Status === 'string') {
    const raw = body.Status.trim()
    fields.Status = STATUS_TO_AIRTABLE[raw] ?? raw
  }
  if (body['Key Result Name'] != null && typeof body['Key Result Name'] === 'string') fields['Key Result Name'] = body['Key Result Name'].trim()
  if (body.Description != null && typeof body.Description === 'string') fields.Description = body.Description.trim()
  if (body.Metric != null && typeof body.Metric === 'string') fields.Metric = body.Metric.trim()
  if (body['Current Value'] != null) {
    const v = body['Current Value']
    fields['Current Value'] = v === '' ? null : (typeof v === 'number' && !Number.isNaN(v) ? v : Number(v))
    if (fields['Current Value'] !== null && Number.isNaN(fields['Current Value'])) fields['Current Value'] = null
  }
  if (body['Target Value'] != null) {
    const v = body['Target Value']
    fields['Target Value'] = v === '' ? null : (typeof v === 'number' && !Number.isNaN(v) ? v : Number(v))
    if (fields['Target Value'] !== null && Number.isNaN(fields['Target Value'])) fields['Target Value'] = null
  }
  if (body.Unit != null && typeof body.Unit === 'string') fields.Unit = body.Unit.trim()
  if (body.Deadline != null) fields.Deadline = body.Deadline === '' ? null : String(body.Deadline).trim()
  if (body['Progress (%)'] != null) fields['Progress (%)'] = body['Progress (%)'] === '' ? null : Number(body['Progress (%)'])
  const objectiveId = body['Objective Link'] ?? body.Objective
  if (objectiveId !== undefined) {
    if (Array.isArray(objectiveId) && objectiveId.length > 0 && objectiveId[0]) {
      fields['Objective Link'] = [String(objectiveId[0]).trim()]
    } else if (typeof objectiveId === 'string' && objectiveId.trim()) {
      fields['Objective Link'] = [objectiveId.trim()]
    } else {
      fields['Objective Link'] = []
    }
  }
  return fields
}

/** @returns {import('../interfaces.js').KeyResultsRepository} */
export function createAirtableKeyResultsRepository() {
  return {
    async list() {
      const data = await fetchTable(TABLE)
      return Array.isArray(data) ? data : []
    },

    async getById(id) {
      return await fetchRecord(TABLE, id)
    },

    async create(fields) {
      const name = (fields['Key Result Name'] != null && typeof fields['Key Result Name'] === 'string') ? fields['Key Result Name'].trim() : ''
      if (!name) throw new Error('Key Result Name is required')
      const requestedStatus = fields.Status != null && typeof fields.Status === 'string' ? fields.Status.trim() : null
      const normalizedStatus = (requestedStatus && (STATUS_TO_AIRTABLE[requestedStatus] ?? requestedStatus)) || 'Not Started'
      const body = { 'Key Result Name': name, Status: normalizedStatus, ...mapFields(fields, true) }
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
