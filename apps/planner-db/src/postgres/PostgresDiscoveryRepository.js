import { query } from '../lib/pg.js'

function rowToRecord(r) {
  if (!r) return null
  const lastModified = r.last_modified && (typeof r.last_modified.toISOString === 'function' ? r.last_modified.toISOString() : r.last_modified)
  return {
    id: r.id,
    'Idea Name': r.idea_name,
    'Idea Description': r.idea_description,
    Category: r.category,
    Status: r.status,
    Priority: r.priority,
    'Date Added': r.date_added ? String(r.date_added).slice(0, 10) : null,
    Objetives: r.objectives || [],
    lastModified,
  }
}

/** @returns {import('../interfaces.js').DiscoveryRepository} */
export function createPostgresDiscoveryRepository() {
  return {
    async list() {
      const res = await query('SELECT * FROM discovery_ideas ORDER BY last_modified DESC')
      return (res.rows || []).map(rowToRecord)
    },
    async getById(id) {
      const res = await query('SELECT * FROM discovery_ideas WHERE id = $1', [id])
      return res.rows?.[0] ? rowToRecord(res.rows[0]) : null
    },
    async create(fields) {
      const name = (fields['Idea Name'] ?? '').trim()
      if (!name) throw new Error('Idea Name is required')
      const objIds = fields.Objectives ?? fields.Objective ?? fields.Objetives
      const objArr = Array.isArray(objIds) ? objIds : objIds != null ? [objIds] : []
      const res = await query(
        `INSERT INTO discovery_ideas (idea_name, idea_description, category, status, priority, date_added, objectives)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [
          name,
          (fields['Idea Description'] ?? '').trim() || null,
          (fields.Category ?? '').trim() || null,
          (fields.Status ?? '').trim() || null,
          (fields.Priority ?? '').trim() || null,
          fields['Date Added'] ? String(fields['Date Added']).slice(0, 10) : null,
          objArr,
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
      if (fields['Idea Name'] !== undefined) { updates.push(`idea_name = $${i++}`); values.push((fields['Idea Name'] ?? '').trim() || null) }
      if (fields['Idea Description'] !== undefined) { updates.push(`idea_description = $${i++}`); values.push((fields['Idea Description'] ?? '').trim() || null) }
      if (fields.Category !== undefined) { updates.push(`category = $${i++}`); values.push((fields.Category ?? '').trim() || null) }
      if (fields.Status !== undefined) { updates.push(`status = $${i++}`); values.push((fields.Status ?? '').trim() || null) }
      if (fields.Priority !== undefined) { updates.push(`priority = $${i++}`); values.push((fields.Priority ?? '').trim() || null) }
      if (fields['Date Added'] !== undefined) { updates.push(`date_added = $${i++}`); values.push(fields['Date Added'] ? String(fields['Date Added']).slice(0, 10) : null) }
      if (fields.Objectives !== undefined) { updates.push(`objectives = $${i++}`); values.push(Array.isArray(fields.Objectives) ? fields.Objectives : []) }
      if (fields.Objetives !== undefined) { updates.push(`objectives = $${i++}`); values.push(Array.isArray(fields.Objetives) ? fields.Objetives : []) }
      if (updates.length === 0) throw new Error('At least one field to update is required')
      updates.push('last_modified = NOW()'); values.push(id)
      const res = await query(`UPDATE discovery_ideas SET ${updates.join(', ')} WHERE id = $${i} RETURNING *`, values)
      if (res.rows.length === 0) { const e = new Error('Not found'); e.statusCode = 404; throw e }
      return rowToRecord(res.rows[0])
    },
    async delete(id) {
      const res = await query('DELETE FROM discovery_ideas WHERE id = $1 RETURNING id', [id])
      if (res.rowCount === 0) { const e = new Error('Not found'); e.statusCode = 404; throw e }
    },
  }
}
