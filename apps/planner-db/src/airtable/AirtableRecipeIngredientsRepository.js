/**
 * Airtable implementation of Recipe Ingredients repository (Recipes base).
 *
 * Table: "Recipe Ingredients"
 * Links:
 * - Recipe: linked record(s) to Recipes table
 * - Ingredient: linked record(s) to Ingredients table
 */
import { fetchTable, fetchRecord, createRecord, updateRecord, deleteRecord, checkConflict, getRecipesBase } from '../lib/airtable.js'

const TABLE = process.env.AIRTABLE_TABLE_RECIPE_INGREDIENTS || 'Recipe Ingredients'

function getBase() {
  const base = getRecipesBase()
  if (!base) throw new Error('Airtable Recipes not configured')
  return base
}

/** Airtable link fields expect arrays of record IDs. */
function mapFields(body) {
  const fields = {}

  if (body.Recipe !== undefined) {
    const v = body.Recipe
    fields.Recipe = Array.isArray(v) ? v : v != null ? [v] : []
  }
  if (body.Ingredient !== undefined) {
    const v = body.Ingredient
    fields.Ingredient = Array.isArray(v) ? v : v != null ? [v] : []
  }
  if (body.Quantity !== undefined) {
    fields.Quantity =
      body.Quantity === '' || body.Quantity == null ? null : (typeof body.Quantity === 'number' ? body.Quantity : Number(body.Quantity))
  }
  if (body.Unit !== undefined) fields.Unit = typeof body.Unit === 'string' ? body.Unit.trim() : body.Unit
  if (body['Optional Ingredient'] !== undefined) fields['Optional Ingredient'] = Boolean(body['Optional Ingredient'])
  if (body.Notes !== undefined) fields.Notes = typeof body.Notes === 'string' ? body.Notes.trim() : body.Notes

  return fields
}

/** @returns {import('../interfaces.js').RecipeIngredientsRepository} */
export function createAirtableRecipeIngredientsRepository() {
  return {
    async list() {
      const data = await fetchTable(TABLE, 500, getBase())
      return Array.isArray(data) ? data : []
    },

    async getById(id) {
      return await fetchRecord(TABLE, id, getBase())
    },

    async create(fields) {
      const mapped = mapFields(fields)
      const recipeId = Array.isArray(mapped.Recipe) ? mapped.Recipe[0] : null
      const ingredientId = Array.isArray(mapped.Ingredient) ? mapped.Ingredient[0] : null
      if (!recipeId || !ingredientId) throw new Error('Recipe and Ingredient are required')
      return await createRecord(TABLE, { ...mapped, Recipe: [recipeId], Ingredient: [ingredientId] }, getBase())
    },

    async update(id, fields, opts = {}) {
      if (opts.clientLastModified) {
        const conflict = await checkConflict(TABLE, id, opts.clientLastModified, getBase())
        if (conflict.conflict) {
          const err = new Error('Conflict')
          err.statusCode = 409
          err.serverLastModified = conflict.serverLastModified
          throw err
        }
      }
      const mapped = mapFields(fields)
      if (Object.keys(mapped).length === 0) throw new Error('At least one field to update is required')
      return await updateRecord(TABLE, id, mapped, getBase())
    },

    async delete(id) {
      await deleteRecord(TABLE, id, getBase())
    },
  }
}

