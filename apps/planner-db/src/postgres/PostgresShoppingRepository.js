import { query } from '../lib/pg.js'

function rowToRecord(r) {
  if (!r) return null
  const lastModified = r.last_modified && (typeof r.last_modified.toISOString === 'function' ? r.last_modified.toISOString() : r.last_modified)
  return {
    id: r.id,
    Name: r.name,
    Category: r.category,
    Description: r.description,
    'Image (Web)': r.image_web,
    'Name ES': r.name_es,
    Notes: r.notes,
    Priority: r.priority,
    Quantity: r.quantity,
    Status: r.status,
    Store: r.store,
    Unit: r.unit,
    lastModified,
  }
}

/** @returns {import('../interfaces.js').ShoppingRepository} */
export function createPostgresShoppingRepository() {
  return {
    async list() {
      const res = await query('SELECT * FROM shopping_items ORDER BY last_modified DESC')
      return (res.rows || []).map(rowToRecord)
    },
    async getById(id) {
      const res = await query('SELECT * FROM shopping_items WHERE id = $1', [id])
      return res.rows?.[0] ? rowToRecord(res.rows[0]) : null
    },
    async create(fields) {
      const name = (fields.Name ?? '').trim() || '(untitled)'
      const res = await query(
        `INSERT INTO shopping_items (name, category, description, image_web, name_es, notes, priority, quantity, status, store, unit)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
        [
          name,
          (fields.Category ?? '').trim() || null,
          (fields.Description ?? '').trim() || null,
          (fields['Image (Web)'] ?? '').trim() || null,
          (fields['Name ES'] ?? '').trim() || null,
          (fields.Notes ?? '').trim() || null,
          (fields.Priority ?? '').trim() || null,
          fields.Quantity ?? null,
          (fields.Status ?? '').trim() || null,
          (fields.Store ?? '').trim() || null,
          (fields.Unit ?? '').trim() || null,
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
      if (fields.Category !== undefined) { updates.push(`category = $${i++}`); values.push((fields.Category ?? '').trim() || null) }
      if (fields.Description !== undefined) { updates.push(`description = $${i++}`); values.push((fields.Description ?? '').trim() || null) }
      if (fields['Image (Web)'] !== undefined) { updates.push(`image_web = $${i++}`); values.push((fields['Image (Web)'] ?? '').trim() || null) }
      if (fields['Name ES'] !== undefined) { updates.push(`name_es = $${i++}`); values.push((fields['Name ES'] ?? '').trim() || null) }
      if (fields.Notes !== undefined) { updates.push(`notes = $${i++}`); values.push((fields.Notes ?? '').trim() || null) }
      if (fields.Priority !== undefined) { updates.push(`priority = $${i++}`); values.push((fields.Priority ?? '').trim() || null) }
      if (fields.Quantity !== undefined) { updates.push(`quantity = $${i++}`); values.push(fields.Quantity) }
      if (fields.Status !== undefined) { updates.push(`status = $${i++}`); values.push((fields.Status ?? '').trim() || null) }
      if (fields.Store !== undefined) { updates.push(`store = $${i++}`); values.push((fields.Store ?? '').trim() || null) }
      if (fields.Unit !== undefined) { updates.push(`unit = $${i++}`); values.push((fields.Unit ?? '').trim() || null) }
      if (updates.length === 0) throw new Error('At least one field to update is required')
      updates.push('last_modified = NOW()'); values.push(id)
      const res = await query(`UPDATE shopping_items SET ${updates.join(', ')} WHERE id = $${i} RETURNING *`, values)
      if (res.rows.length === 0) { const e = new Error('Not found'); e.statusCode = 404; throw e }
      return rowToRecord(res.rows[0])
    },
    async delete(id) {
      const res = await query('DELETE FROM shopping_items WHERE id = $1 RETURNING id', [id])
      if (res.rowCount === 0) { const e = new Error('Not found'); e.statusCode = 404; throw e }
    },
  }
}
