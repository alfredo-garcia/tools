import { field, str, dateStr, arr } from '@tools/shared'

/**
 * Returns meals that belong to the given day and meal type.
 * @param {Array<{ id: string, fields: object }>} meals - List of meal records (id + Airtable fields)
 * @param {string} dayStr - Date string YYYY-MM-DD
 * @param {string} mealType - 'Breakfast' | 'Lunch' | 'Dinner'
 */
export function getMealsForSlot(meals, dayStr, mealType) {
  if (!Array.isArray(meals)) return []
  return meals.filter((m) => {
    const d = dateStr(field(m, 'Date'))
    const type = str(field(m, 'Meal Type'))
    return d === dayStr && type === mealType
  })
}

/**
 * Returns whether a recipe matches the given meal type (for filtering Recipes by slot).
 * Handles Meal Type as single value or array (Airtable multi-select).
 */
export function recipeMatchesMealType(recipe, mealType) {
  if (!recipe || !mealType) return false
  const mt = field(recipe, 'Meal Type')
  const values = arr(mt)
  return values.some((v) => String(v).trim() === mealType)
}
