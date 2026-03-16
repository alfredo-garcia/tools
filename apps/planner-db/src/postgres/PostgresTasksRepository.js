/**
 * Postgres implementation of Tasks repository.
 * Returns records in Airtable-like shape for planner-api mappers.
 */
import { query } from '../lib/pg.js'

function rowToRecord(r) {
  if (!r) return null
  const lastModified = r.last_modified && (typeof r.last_modified.toISOString === 'function' ? r.last_modified.toISOString() : r.last_modified)
  return {
    id: r.id,
    'Task Name': r.task_name,
    Status: r.status,
    Description: r.description,
    'Due Date': r.due_date ? String(r.due_date).slice(0, 10) : null,
    Priority: r.priority,
    Assignee: r.assignee,
    Category: r.category,
    'Key Result': r.key_results || [],
    Objectives: r.objectives || [],
    lastModified,
  }
}

/** @returns {import('../interfaces.js').TasksRepository} */
export function createPostgresTasksRepository() {
  return {
    async list() {
      const res = await query('SELECT * FROM tasks ORDER BY due_date NULLS LAST, last_modified DESC')
      return (res.rows || []).map(rowToRecord)
    },

    async getById(id) {
      const res = await query('SELECT * FROM tasks WHERE id = $1', [id])
      return res.rows?.[0] ? rowToRecord(res.rows[0]) : null
    },

    async create(fields) {
      const keyResults = fields['Key Results'] ?? fields['Key Result']
      const krArr = Array.isArray(keyResults) ? keyResults : keyResults != null ? [keyResults] : []
      const objArr = Array.isArray(fields.Objectives) ? fields.Objectives : fields.Objectives != null ? [fields.Objectives] : []
      const res = await query(
        `INSERT INTO tasks (task_name, status, description, due_date, priority, assignee, category, key_results, objectives)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING *`,
        [
          (fields['Task Name'] ?? '').trim() || null,
          (fields.Status ?? '').trim() || null,
          (fields.Description ?? '').trim() || null,
          fields['Due Date'] ? String(fields['Due Date']).trim().slice(0, 10) : null,
          (fields.Priority ?? '').trim() || null,
          (fields.Assignee ?? '').trim() || null,
          (fields.Category ?? '').trim() || null,
          krArr,
          objArr,
        ]
      )
      return rowToRecord(res.rows[0])
    },

    async update(id, fields, opts = {}) {
      if (opts.clientLastModified) {
        const current = await this.getById(id)
        if (current?.lastModified && new Date(current.lastModified) > new Date(opts.clientLastModified)) {
          const err = new Error('Conflict')
          err.statusCode = 409
          err.serverLastModified = current.lastModified
          throw err
        }
      }
      const updates = []
      const values = []
      let i = 1
      if (fields['Task Name'] !== undefined) { updates.push(`task_name = $${i++}`); values.push(fields['Task Name']?.trim() ?? null) }
      if (fields.Status !== undefined) { updates.push(`status = $${i++}`); values.push(fields.Status?.trim() ?? null) }
      if (fields.Description !== undefined) { updates.push(`description = $${i++}`); values.push(fields.Description?.trim() ?? null) }
      if (fields['Due Date'] !== undefined) { updates.push(`due_date = $${i++}`); values.push(fields['Due Date'] ? String(fields['Due Date']).slice(0, 10) : null) }
      if (fields.Priority !== undefined) { updates.push(`priority = $${i++}`); values.push(fields.Priority?.trim() ?? null) }
      if (fields.Assignee !== undefined) { updates.push(`assignee = $${i++}`); values.push(fields.Assignee?.trim() ?? null) }
      if (fields.Category !== undefined) { updates.push(`category = $${i++}`); values.push(fields.Category?.trim() ?? null) }
      if (fields['Key Results'] !== undefined) { updates.push(`key_results = $${i++}`); values.push(Array.isArray(fields['Key Results']) ? fields['Key Results'] : []) }
      if (fields['Key Result'] !== undefined) { updates.push(`key_results = $${i++}`); values.push(Array.isArray(fields['Key Result']) ? fields['Key Result'] : [fields['Key Result']]) }
      if (fields.Objectives !== undefined) { updates.push(`objectives = $${i++}`); values.push(Array.isArray(fields.Objectives) ? fields.Objectives : []) }
      if (updates.length === 0) throw new Error('At least one field to update is required')
      updates.push(`last_modified = NOW()`)
      values.push(id)
      const res = await query(
        `UPDATE tasks SET ${updates.join(', ')} WHERE id = $${i} RETURNING *`,
        values
      )
      if (res.rows.length === 0) {
        const err = new Error('Not found')
        err.statusCode = 404
        throw err
      }
      return rowToRecord(res.rows[0])
    },

    async delete(id) {
      const res = await query('DELETE FROM tasks WHERE id = $1 RETURNING id', [id])
      if (res.rowCount === 0) {
        const err = new Error('Not found')
        err.statusCode = 404
        throw err
      }
    },
  }
}
