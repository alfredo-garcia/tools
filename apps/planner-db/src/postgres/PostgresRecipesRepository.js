import { query } from '../lib/pg.js'

function rowToRecord(r) {
  if (!r) return null
  const lastModified = r.last_modified && (typeof r.last_modified.toISOString === 'function' ? r.last_modified.toISOString() : r.last_modified)
  return {
    id: r.id,
    Name: r.name,
    'Name ES': r.name_es,
    Description: r.description,
    'Meal Type': r.meal_type || [],
    'Cooking Process': r.cooking_process,
    'Complexity Rating': r.complexity_rating,
    'Nutrient Rating': r.nutrient_rating,
    'Time to Cook (minutes)': r.time_to_cook_minutes,
    Servings: r.servings,
    'Cuisine Type': r.cuisine_type,
    'Source/URL': r.source_url,
    Tags: r.tags,
    lastModified,
  }
}

/** @returns {import('../interfaces.js').RecipesRepository} */
export function createPostgresRecipesRepository() {
  return {
    async list() {
      const res = await query('SELECT * FROM recipes ORDER BY last_modified DESC')
      return (res.rows || []).map(rowToRecord)
    },
    async getById(id) {
      const res = await query('SELECT * FROM recipes WHERE id = $1', [id])
      return res.rows?.[0] ? rowToRecord(res.rows[0]) : null
    },
    async create(fields) {
      const name = (fields.Name ?? '').trim()
      if (!name) throw new Error('Name is required')
      const mealType = fields['Meal Type']; const mtArr = Array.isArray(mealType) ? mealType : mealType != null ? [mealType] : []
      const res = await query(
        `INSERT INTO recipes (name, name_es, description, meal_type, cooking_process, complexity_rating, nutrient_rating, time_to_cook_minutes, servings, cuisine_type, source_url, tags)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
        [
          name,
          (fields['Name ES'] ?? '').trim() || null,
          (fields.Description ?? '').trim() || null,
          mtArr,
          (fields['Cooking Process'] ?? '').trim() || null,
          fields['Complexity Rating'] ?? null,
          fields['Nutrient Rating'] ?? null,
          fields['Time to Cook (minutes)'] ?? null,
          fields.Servings ?? null,
          (fields['Cuisine Type'] ?? '').trim() || null,
          (fields['Source/URL'] ?? '').trim() || null,
          (fields.Tags ?? '').trim() || null,
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
      if (fields['Meal Type'] !== undefined) { updates.push(`meal_type = $${i++}`); values.push(Array.isArray(fields['Meal Type']) ? fields['Meal Type'] : []) }
      if (fields['Cooking Process'] !== undefined) { updates.push(`cooking_process = $${i++}`); values.push((fields['Cooking Process'] ?? '').trim() || null) }
      if (fields['Complexity Rating'] !== undefined) { updates.push(`complexity_rating = $${i++}`); values.push(fields['Complexity Rating']) }
      if (fields['Nutrient Rating'] !== undefined) { updates.push(`nutrient_rating = $${i++}`); values.push(fields['Nutrient Rating']) }
      if (fields['Time to Cook (minutes)'] !== undefined) { updates.push(`time_to_cook_minutes = $${i++}`); values.push(fields['Time to Cook (minutes)']) }
      if (fields.Servings !== undefined) { updates.push(`servings = $${i++}`); values.push(fields.Servings) }
      if (fields['Cuisine Type'] !== undefined) { updates.push(`cuisine_type = $${i++}`); values.push((fields['Cuisine Type'] ?? '').trim() || null) }
      if (fields['Source/URL'] !== undefined) { updates.push(`source_url = $${i++}`); values.push((fields['Source/URL'] ?? '').trim() || null) }
      if (fields.Tags !== undefined) { updates.push(`tags = $${i++}`); values.push((fields.Tags ?? '').trim() || null) }
      if (updates.length === 0) throw new Error('At least one field to update is required')
      updates.push('last_modified = NOW()'); values.push(id)
      const res = await query(`UPDATE recipes SET ${updates.join(', ')} WHERE id = $${i} RETURNING *`, values)
      if (res.rows.length === 0) { const e = new Error('Not found'); e.statusCode = 404; throw e }
      return rowToRecord(res.rows[0])
    },
    async delete(id) {
      const res = await query('DELETE FROM recipes WHERE id = $1 RETURNING id', [id])
      if (res.rowCount === 0) { const e = new Error('Not found'); e.statusCode = 404; throw e }
    },
  }
}
