import { query } from '../lib/pg.js'

function rowToRecord(r) {
  if (!r) return null
  const lastModified = r.last_modified && (typeof r.last_modified.toISOString === 'function' ? r.last_modified.toISOString() : r.last_modified)
  return {
    id: r.id,
    Recipe: r.recipe_id ? [r.recipe_id] : [],
    Ingredient: r.ingredient_id ? [r.ingredient_id] : [],
    Quantity: r.quantity,
    Unit: r.unit,
    'Optional Ingredient': r.optional_ingredient,
    Notes: r.notes,
    lastModified,
  }
}

/** @returns {import('../interfaces.js').RecipeIngredientsRepository} */
export function createPostgresRecipeIngredientsRepository() {
  return {
    async list() {
      const res = await query('SELECT * FROM recipe_ingredients ORDER BY last_modified DESC')
      return (res.rows || []).map(rowToRecord)
    },
    async getById(id) {
      const res = await query('SELECT * FROM recipe_ingredients WHERE id = $1', [id])
      return res.rows?.[0] ? rowToRecord(res.rows[0]) : null
    },
    async create(fields) {
      const recipeId = Array.isArray(fields.Recipe) ? fields.Recipe[0] : fields.Recipe
      const ingredientId = Array.isArray(fields.Ingredient) ? fields.Ingredient[0] : fields.Ingredient
      if (!recipeId || !ingredientId) throw new Error('Recipe and Ingredient are required')
      const res = await query(
        `INSERT INTO recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional_ingredient, notes)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [
          recipeId,
          ingredientId,
          fields.Quantity ?? null,
          (fields.Unit ?? '').trim() || null,
          Boolean(fields['Optional Ingredient']),
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
      if (fields.Recipe !== undefined) { updates.push(`recipe_id = $${i++}`); values.push(Array.isArray(fields.Recipe) ? fields.Recipe[0] : fields.Recipe || null) }
      if (fields.Ingredient !== undefined) { updates.push(`ingredient_id = $${i++}`); values.push(Array.isArray(fields.Ingredient) ? fields.Ingredient[0] : fields.Ingredient || null) }
      if (fields.Quantity !== undefined) { updates.push(`quantity = $${i++}`); values.push(fields.Quantity === '' ? null : fields.Quantity) }
      if (fields.Unit !== undefined) { updates.push(`unit = $${i++}`); values.push((fields.Unit ?? '').trim() || null) }
      if (fields['Optional Ingredient'] !== undefined) { updates.push(`optional_ingredient = $${i++}`); values.push(Boolean(fields['Optional Ingredient'])) }
      if (fields.Notes !== undefined) { updates.push(`notes = $${i++}`); values.push((fields.Notes ?? '').trim() || null) }
      if (updates.length === 0) throw new Error('At least one field to update is required')
      updates.push('last_modified = NOW()'); values.push(id)
      const res = await query(`UPDATE recipe_ingredients SET ${updates.join(', ')} WHERE id = $${i} RETURNING *`, values)
      if (res.rows.length === 0) { const e = new Error('Not found'); e.statusCode = 404; throw e }
      return rowToRecord(res.rows[0])
    },
    async delete(id) {
      const res = await query('DELETE FROM recipe_ingredients WHERE id = $1 RETURNING id', [id])
      if (res.rowCount === 0) { const e = new Error('Not found'); e.statusCode = 404; throw e }
    },
  }
}

