import { query } from '../lib/pg.js'

function rowToRecord(r) {
  if (!r) return null
  const lastModified = r.last_modified && (typeof r.last_modified.toISOString === 'function' ? r.last_modified.toISOString() : r.last_modified)
  return {
    id: r.id,
    Name: r.name,
    'Name ES': r.name_es,
    Description: r.description,
    Category: r.category,
    Unit: r.unit,
    Notes: r.notes,
    lastModified,
  }
}

/** @returns {import('../interfaces.js').IngredientsRepository} */
export function createPostgresIngredientsRepository() {
  return {
    async list() {
      const res = await query('SELECT * FROM ingredients ORDER BY last_modified DESC')
      return (res.rows || []).map(rowToRecord)
    },
    async getById(id) {
      const res = await query('SELECT * FROM ingredients WHERE id = $1', [id])
      return res.rows?.[0] ? rowToRecord(res.rows[0]) : null
    },
    async create(fields) {
      const name = (fields.Name ?? '').trim()
      if (!name) throw new Error('Name is required')
      const res = await query(
        `INSERT INTO ingredients (name, name_es, description, category, unit, notes) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [
          name,
          (fields['Name ES'] ?? '').trim() || null,
          (fields.Description ?? '').trim() || null,
          (fields.Category ?? '').trim() || null,
          (fields.Unit ?? '').trim() || null,
          (fields.Notes ?? '').trim() || null,
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
      if (fields.Name !== undefined) { updates.push(`name = $${i++}`); values.push((fields.Name ?? '').trim() || null) }
      if (fields['Name ES'] !== undefined) { updates.push(`name_es = $${i++}`); values.push((fields['Name ES'] ?? '').trim() || null) }
      if (fields.Description !== undefined) { updates.push(`description = $${i++}`); values.push((fields.Description ?? '').trim() || null) }
      if (fields.Category !== undefined) { updates.push(`category = $${i++}`); values.push((fields.Category ?? '').trim() || null) }
      if (fields.Unit !== undefined) { updates.push(`unit = $${i++}`); values.push((fields.Unit ?? '').trim() || null) }
      if (fields.Notes !== undefined) { updates.push(`notes = $${i++}`); values.push((fields.Notes ?? '').trim() || null) }
      if (updates.length === 0) throw new Error('At least one field to update is required')
      updates.push('last_modified = NOW()'); values.push(id)
      const res = await query(`UPDATE ingredients SET ${updates.join(', ')} WHERE id = $${i} RETURNING *`, values)
      if (res.rows.length === 0) { const e = new Error('Not found'); e.statusCode = 404; throw e }
      return rowToRecord(res.rows[0])
    },
    async delete(id) {
      const res = await query('DELETE FROM ingredients WHERE id = $1 RETURNING id', [id])
      if (res.rowCount === 0) { const e = new Error('Not found'); e.statusCode = 404; throw e }
    },
  }
}
