import { query } from '../lib/pg.js'

function rowToRecord(r) {
  if (!r) return null
  const lastModified = r.last_modified && (typeof r.last_modified.toISOString === 'function' ? r.last_modified.toISOString() : r.last_modified)
  return {
    id: r.id,
    'Key Result Name': r.key_result_name,
    Status: r.status,
    Description: r.description,
    Metric: r.metric,
    'Current Value': r.current_value,
    'Target Value': r.target_value,
    Unit: r.unit,
    Deadline: r.deadline ? String(r.deadline).slice(0, 10) : null,
    'Progress (%)': r.progress_percent,
    'Objective Link': r.objective_link || [],
    lastModified,
  }
}

/** @returns {import('../interfaces.js').KeyResultsRepository} */
export function createPostgresKeyResultsRepository() {
  return {
    async list() {
      const res = await query('SELECT * FROM key_results ORDER BY last_modified DESC')
      return (res.rows || []).map(rowToRecord)
    },
    async getById(id) {
      const res = await query('SELECT * FROM key_results WHERE id = $1', [id])
      return res.rows?.[0] ? rowToRecord(res.rows[0]) : null
    },
    async create(fields) {
      const name = (fields['Key Result Name'] ?? '').trim()
      if (!name) throw new Error('Key Result Name is required')
      const objLink = fields['Objective Link'] ?? []
      const res = await query(
        `INSERT INTO key_results (key_result_name, status, description, metric, current_value, target_value, unit, deadline, progress_percent, objective_link)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
        [
          name,
          (fields.Status ?? 'Not Started').trim(),
          (fields.Description ?? '').trim() || null,
          (fields.Metric ?? '').trim() || null,
          fields['Current Value'] ?? null,
          fields['Target Value'] ?? null,
          (fields.Unit ?? '').trim() || null,
          fields.Deadline ? String(fields.Deadline).slice(0, 10) : null,
          fields['Progress (%)'] ?? null,
          Array.isArray(objLink) ? objLink : [objLink].filter(Boolean),
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
      if (fields['Key Result Name'] !== undefined) { updates.push(`key_result_name = $${i++}`); values.push((fields['Key Result Name'] ?? '').trim() || null) }
      if (fields.Status !== undefined) { updates.push(`status = $${i++}`); values.push((fields.Status ?? '').trim() || null) }
      if (fields.Description !== undefined) { updates.push(`description = $${i++}`); values.push((fields.Description ?? '').trim() || null) }
      if (fields.Metric !== undefined) { updates.push(`metric = $${i++}`); values.push((fields.Metric ?? '').trim() || null) }
      if (fields['Current Value'] !== undefined) { updates.push(`current_value = $${i++}`); values.push(fields['Current Value']) }
      if (fields['Target Value'] !== undefined) { updates.push(`target_value = $${i++}`); values.push(fields['Target Value']) }
      if (fields.Unit !== undefined) { updates.push(`unit = $${i++}`); values.push((fields.Unit ?? '').trim() || null) }
      if (fields.Deadline !== undefined) { updates.push(`deadline = $${i++}`); values.push(fields.Deadline ? String(fields.Deadline).slice(0, 10) : null) }
      if (fields['Progress (%)'] !== undefined) { updates.push(`progress_percent = $${i++}`); values.push(fields['Progress (%)']) }
      if (fields['Objective Link'] !== undefined) { updates.push(`objective_link = $${i++}`); values.push(Array.isArray(fields['Objective Link']) ? fields['Objective Link'] : []) }
      if (updates.length === 0) throw new Error('At least one field to update is required')
      updates.push('last_modified = NOW()'); values.push(id)
      const res = await query(`UPDATE key_results SET ${updates.join(', ')} WHERE id = $${i} RETURNING *`, values)
      if (res.rows.length === 0) { const e = new Error('Not found'); e.statusCode = 404; throw e }
      return rowToRecord(res.rows[0])
    },
    async delete(id) {
      const res = await query('DELETE FROM key_results WHERE id = $1 RETURNING id', [id])
      if (res.rowCount === 0) { const e = new Error('Not found'); e.statusCode = 404; throw e }
    },
  }
}
