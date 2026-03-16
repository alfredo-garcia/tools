import { query } from '../lib/pg.js'

function rowToRecord(r) {
  if (!r) return null
  const lastModified = r.last_modified && (typeof r.last_modified.toISOString === 'function' ? r.last_modified.toISOString() : r.last_modified)
  return {
    id: r.id,
    'Meal Type': r.meal_type,
    Date: r.date ? String(r.date).slice(0, 10) : null,
    Meal: r.meal,
    lastModified,
  }
}

/** @returns {import('../interfaces.js').MealsRepository} */
export function createPostgresMealsRepository() {
  return {
    async list() {
      const res = await query('SELECT * FROM meals ORDER BY date DESC, last_modified DESC')
      return (res.rows || []).map(rowToRecord)
    },
    async getById(id) {
      const res = await query('SELECT * FROM meals WHERE id = $1', [id])
      return res.rows?.[0] ? rowToRecord(res.rows[0]) : null
    },
    async create(fields) {
      const mealType = (fields['Meal Type'] ?? '').trim()
      const date = fields.Date ? String(fields.Date).slice(0, 10) : null
      if (!mealType || !date) throw new Error('Meal Type and Date are required')
      const res = await query(
        'INSERT INTO meals (meal_type, date, meal) VALUES ($1, $2, $3) RETURNING *',
        [mealType, date, (fields.Meal ?? '').trim() || null]
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
      if (fields['Meal Type'] !== undefined) { updates.push(`meal_type = $${i++}`); values.push((fields['Meal Type'] ?? '').trim() || null) }
      if (fields.Date !== undefined) { updates.push(`date = $${i++}`); values.push(fields.Date ? String(fields.Date).slice(0, 10) : null) }
      if (fields.Meal !== undefined) { updates.push(`meal = $${i++}`); values.push((fields.Meal ?? '').trim() || null) }
      if (updates.length === 0) throw new Error('At least one field to update is required')
      updates.push('last_modified = NOW()'); values.push(id)
      const res = await query(`UPDATE meals SET ${updates.join(', ')} WHERE id = $${i} RETURNING *`, values)
      if (res.rows.length === 0) { const e = new Error('Not found'); e.statusCode = 404; throw e }
      return rowToRecord(res.rows[0])
    },
    async delete(id) {
      const res = await query('DELETE FROM meals WHERE id = $1 RETURNING id', [id])
      if (res.rowCount === 0) { const e = new Error('Not found'); e.statusCode = 404; throw e }
    },
  }
}
