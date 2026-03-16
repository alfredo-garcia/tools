/**
 * Airtable implementation of Meals repository.
 */
import { fetchTable, fetchRecord, createRecord, updateRecord, deleteRecord, checkConflict } from '../lib/airtable.js'

const TABLE = process.env.AIRTABLE_TABLE_MEALS || 'Meals'
const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner', 'Sauce', 'Dessert', 'Snack', 'Tapa']

function mapFields(body) {
  const fields = {}
  if (body['Meal Type'] != null && MEAL_TYPES.includes(String(body['Meal Type']).trim())) {
    fields['Meal Type'] = String(body['Meal Type']).trim()
  }
  if (body.Date != null && /^\d{4}-\d{2}-\d{2}/.test(String(body.Date))) {
    fields.Date = String(body.Date).slice(0, 10)
  }
  if (body.Meal != null && typeof body.Meal === 'string') fields.Meal = body.Meal.trim() || null
  if (body.Recipe != null && typeof body.Recipe === 'string') fields.Meal = body.Recipe.trim() || null
  return fields
}

/** @returns {import('../interfaces.js').MealsRepository} */
export function createAirtableMealsRepository() {
  return {
    async list() {
      const data = await fetchTable(TABLE, 500)
      return Array.isArray(data) ? data : []
    },

    async getById(id) {
      return await fetchRecord(TABLE, id)
    },

    async create(fields) {
      const mealType = fields['Meal Type'] != null && MEAL_TYPES.includes(String(fields['Meal Type']).trim()) ? String(fields['Meal Type']).trim() : null
      const date = fields.Date != null && /^\d{4}-\d{2}-\d{2}/.test(String(fields.Date)) ? String(fields.Date).slice(0, 10) : null
      if (!mealType || !date) throw new Error('Meal Type and Date are required')
      const recipeId = (fields.Meal != null ? String(fields.Meal).trim() : null) || (fields.Recipe != null ? String(fields.Recipe).trim() : null)
      const body = { 'Meal Type': mealType, Date: date }
      if (recipeId) body.Meal = recipeId
      return await createRecord(TABLE, body)
    },

    async update(id, fields, opts = {}) {
      if (opts.clientLastModified) {
        const conflict = await checkConflict(TABLE, id, opts.clientLastModified)
        if (conflict.conflict) {
          const err = new Error('Conflict')
          err.statusCode = 409
          err.serverLastModified = conflict.serverLastModified
          throw err
        }
      }
      const mapped = mapFields(fields)
      if (Object.keys(mapped).length === 0) throw new Error('At least one field to update is required')
      return await updateRecord(TABLE, id, mapped)
    },

    async delete(id) {
      await deleteRecord(TABLE, id)
    },
  }
}
