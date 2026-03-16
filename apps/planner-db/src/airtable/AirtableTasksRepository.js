/**
 * Airtable implementation of Tasks repository.
 * Table name from env AIRTABLE_TABLE_TASKS or 'Tasks'.
 */
import { fetchTable, fetchRecord, createRecord, updateRecord, deleteRecord, checkConflict } from '../lib/airtable.js'

const TABLE = process.env.AIRTABLE_TABLE_TASKS || 'Tasks'
const TASKS_KR_FIELD = process.env.AIRTABLE_TASKS_KR_FIELD || 'Key Result'

const STATUS_TO_AIRTABLE = {
  Pending: 'Todo',
  'In Progress': 'In Progress',
  Done: 'Done',
}

function sanitize(record) {
  if (!record || typeof record !== 'object') return record
  const key = 'Task Summary (AI)'
  if (record[key] != null && typeof record[key] === 'object' && record[key].state === 'error') {
    const out = { ...record }
    delete out[key]
    return out
  }
  return record
}

function mapFieldsToAirtable(body) {
  const fields = {}
  if (body.Status != null && typeof body.Status === 'string') {
    const value = body.Status.trim()
    fields.Status = STATUS_TO_AIRTABLE[value] ?? value
  }
  if (body['Task Name'] != null && typeof body['Task Name'] === 'string') fields['Task Name'] = body['Task Name'].trim()
  if (body.Description != null && typeof body.Description === 'string') fields.Description = body.Description.trim()
  if (body['Due Date'] != null) fields['Due Date'] = body['Due Date'] === '' ? null : String(body['Due Date']).trim()
  if (body.Priority != null && typeof body.Priority === 'string') fields.Priority = body.Priority.trim()
  if (body.Assignee != null && typeof body.Assignee === 'string') fields.Assignee = body.Assignee.trim()
  if (body.Category != null && typeof body.Category === 'string') fields.Category = body.Category.trim()
  const krIds = body['Key Results'] ?? body['Key Result']
  if (krIds !== undefined) {
    if (Array.isArray(krIds)) {
      fields[TASKS_KR_FIELD] = krIds.filter((id) => typeof id === 'string' && id.trim())
    } else if (typeof krIds === 'string') {
      fields[TASKS_KR_FIELD] = krIds.trim() ? [krIds.trim()] : []
    }
  }
  const objIds = body.Objectives ?? body.Objective
  if (Array.isArray(objIds) && objIds.length > 0) {
    fields.Objectives = objIds.filter((id) => typeof id === 'string' && id.trim())
  } else if (typeof objIds === 'string' && objIds.trim()) {
    fields.Objectives = [objIds.trim()]
  }
  return fields
}

/**
 * @typedef {Object} TasksRepository
 * @property {() => Promise<Object[]>} list
 * @property {(id: string) => Promise<Object|null>} getById
 * @property {(fields: Object) => Promise<Object>} create
 * @property {(id: string, fields: Object) => Promise<Object>} update
 * @property {(id: string) => Promise<void>} delete
 */

/** @returns {TasksRepository} */
export function createAirtableTasksRepository() {
  return {
    async list() {
      const raw = await fetchTable(TABLE)
      return (Array.isArray(raw) ? raw : []).map(sanitize)
    },

    async getById(id) {
      const raw = await fetchRecord(TABLE, id)
      return raw ? sanitize(raw) : null
    },

    async create(fields) {
      const body = {
        'Task Name': (fields['Task Name'] != null && typeof fields['Task Name'] === 'string') ? fields['Task Name'].trim() : '',
        ...mapFieldsToAirtable(fields),
      }
      if (!body['Task Name']) throw new Error('Task Name is required')
      const created = await createRecord(TABLE, body)
      return sanitize(created)
    },

    async update(id, fields, { clientLastModified } = {}) {
      if (clientLastModified) {
        const conflict = await checkConflict(TABLE, id, clientLastModified)
        if (conflict.conflict) {
          const err = new Error('Conflict')
          err.statusCode = 409
          err.serverLastModified = conflict.serverLastModified
          throw err
        }
      }
      const mapped = mapFieldsToAirtable(fields)
      if (Object.keys(mapped).length === 0) throw new Error('At least one field to update is required')
      const updated = await updateRecord(TABLE, id, mapped)
      return sanitize(updated)
    },

    async delete(id) {
      await deleteRecord(TABLE, id)
    },
  }
}
