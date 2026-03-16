import { query } from '../lib/pg.js'

function rowToRecord(r) {
  if (!r) return null
  const lastModified = r.last_modified && (typeof r.last_modified.toISOString === 'function' ? r.last_modified.toISOString() : r.last_modified)
  return {
    id: r.id,
    'Objective Name': r.objective_name,
    Status: r.status,
    Description: r.description,
    Category: r.category,
    Priority: r.priority,
    'Start Date': r.start_date ? String(r.start_date).slice(0, 10) : null,
    'Target Date': r.target_date ? String(r.target_date).slice(0, 10) : null,
    lastModified,
  }
}

/** @returns {import('../interfaces.js').ObjectivesRepository} */
export function createPostgresObjectivesRepository() {
  return {
    async list() {
      const res = await query('SELECT * FROM objectives ORDER BY last_modified DESC')
      return (res.rows || []).map(rowToRecord)
    },
    async getById(id) {
      const res = await query('SELECT * FROM objectives WHERE id = $1', [id])
      return res.rows?.[0] ? rowToRecord(res.rows[0]) : null
    },
    async create(fields) {
      const name = (fields['Objective Name'] ?? '').trim()
      if (!name) throw new Error('Objective Name is required')
      const res = await query(
        `INSERT INTO objectives (objective_name, status, description, category, priority, start_date, target_date)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [
          name,
          (fields.Status ?? 'Pending').trim(),
          (fields.Description ?? '').trim() || null,
          (fields.Category ?? '').trim() || null,
          (fields.Priority ?? '').trim() || null,
          fields['Start Date'] ? String(fields['Start Date']).slice(0, 10) : null,
          fields['Target Date'] ? String(fields['Target Date']).slice(0, 10) : null,
        ]
      )
      return rowToRecord(res.rows[0])
    },
    async update(id, fields, opts = {}) {
      if (opts.clientLastModified) {
        const cur = await this.getById(id)
        if (cur?.lastModified && new Date(cur.lastModified) > new Date(opts.clientLastModified)) {
          const err = new Error('Conflict'); err.statusCode = 409; err.serverLastModified = cur.lastModified; throw err
        }
      }
      const updates = []; const values = []; let i = 1
      if (fields['Objective Name'] !== undefined) { updates.push(`objective_name = $${i++}`); values.push((fields['Objective Name'] ?? '').trim() || null) }
      if (fields.Status !== undefined) { updates.push(`status = $${i++}`); values.push((fields.Status ?? '').trim() || null) }
      if (fields.Description !== undefined) { updates.push(`description = $${i++}`); values.push((fields.Description ?? '').trim() || null) }
      if (fields.Category !== undefined) { updates.push(`category = $${i++}`); values.push((fields.Category ?? '').trim() || null) }
      if (fields.Priority !== undefined) { updates.push(`priority = $${i++}`); values.push((fields.Priority ?? '').trim() || null) }
      if (fields['Start Date'] !== undefined) { updates.push(`start_date = $${i++}`); values.push(fields['Start Date'] ? String(fields['Start Date']).slice(0, 10) : null) }
      if (fields['Target Date'] !== undefined) { updates.push(`target_date = $${i++}`); values.push(fields['Target Date'] ? String(fields['Target Date']).slice(0, 10) : null) }
      if (updates.length === 0) throw new Error('At least one field to update is required')
      updates.push('last_modified = NOW()'); values.push(id)
      const res = await query(`UPDATE objectives SET ${updates.join(', ')} WHERE id = $${i} RETURNING *`, values)
      if (res.rows.length === 0) { const e = new Error('Not found'); e.statusCode = 404; throw e }
      return rowToRecord(res.rows[0])
    },
    async delete(id) {
      const res = await query('DELETE FROM objectives WHERE id = $1 RETURNING id', [id])
      if (res.rowCount === 0) { const e = new Error('Not found'); e.statusCode = 404; throw e }
    },
  }
}
