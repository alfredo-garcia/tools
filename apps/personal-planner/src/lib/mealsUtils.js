import { field, str, dateStr, arr } from '@tools/shared'

/** Opciones de Meal Type para filtros y formularios (Recipes + Meals). */
export const MEAL_TYPE_OPTIONS = [
  'Breakfast',
  'Lunch',
  'Dinner',
  'Sauce',
  'Dessert',
  'Snack',
  'Tapa',
]

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

/**
 * Returns ingredient names for a recipe from Recipe Ingredients + Ingredients table.
 * @param {string} recipeId - Recipe record id
 * @param {Array<{ id: string, fields: object }>} recipeIngredients - All recipe-ingredient records
 * @param {Array<{ id: string, fields: object }>} ingredients - All ingredient records (id -> Name, Name ES)
 * @returns {Array<{ name: string, displayName: string }>} name = for matching Shopping List (Name), displayName = for UI (Name ES or Name)
 */
export function getRecipeIngredientNames(recipeId, recipeIngredients, ingredients) {
  if (!recipeId || !Array.isArray(recipeIngredients) || !Array.isArray(ingredients)) return []
  const ingMap = new Map(ingredients.map((i) => [i.id, i]))
  const seen = new Set()
  return recipeIngredients
    .filter((ri) => arr(field(ri, 'Recipe')).includes(recipeId))
    .map((ri) => {
      const ingId = arr(field(ri, 'Ingredient'))[0]
      const ing = ingMap.get(ingId)
      const name = (ing && str(field(ing, 'Name'))) || ''
      const displayName = (ing && (str(field(ing, 'Name ES')) || str(field(ing, 'Name')))) || name || '(ingredient)'
      return { name: name.trim(), displayName: displayName.trim() || name.trim() }
    })
    .filter(({ name }) => name && !seen.has(name) && (seen.add(name), true))
}

/**
 * Returns recipe ingredients that are missing from the shopping list (not present or not Have).
 * @param {Array<{ name: string, displayName: string }>} recipeIngredientNames - From getRecipeIngredientNames
 * @param {Array<{ id: string, fields: object }>} shoppingList - Shopping list records
 * @returns {Array<{ displayName: string, name: string, shoppingItem?: object }>} Missing ingredients; shoppingItem set if found in list (for PATCH)
 */
export function getMissingIngredients(recipeIngredientNames, shoppingList) {
  if (!Array.isArray(recipeIngredientNames) || !Array.isArray(shoppingList)) return []
  const byName = new Map()
  shoppingList.forEach((item) => {
    const n = str(field(item, 'Name')).trim()
    if (n) byName.set(n, item)
  })
  return recipeIngredientNames
    .filter(({ name }) => name)
    .map(({ name, displayName }) => {
      const shoppingItem = byName.get(name)
      const status = shoppingItem ? str(field(shoppingItem, 'Status')) : ''
      const isHave = status === 'Have'
      if (isHave) return null
      return { displayName, name, shoppingItem: shoppingItem || undefined }
    })
    .filter(Boolean)
}

/**
 * Returns recipe ingredients that ARE in the shopping list, split by current status (Need first, then Have).
 * Used to show a confirmation modal when adding a recipe so the user can review/toggle Have vs Need.
 * @param {Array<{ name: string, displayName: string }>} recipeIngredientNames - From getRecipeIngredientNames
 * @param {Array<{ id: string, fields: object }>} shoppingList - Shopping list records
 * @returns {{ need: Array<{ displayName: string, name: string, shoppingItem: object }>, have: Array<{ displayName: string, name: string, shoppingItem: object }> }}
 */
export function getRecipeIngredientsInShoppingList(recipeIngredientNames, shoppingList) {
  if (!Array.isArray(recipeIngredientNames) || !Array.isArray(shoppingList)) return { need: [], have: [] }
  const byName = new Map()
  shoppingList.forEach((item) => {
    const n = str(field(item, 'Name')).trim()
    if (n) byName.set(n, item)
  })
  const need = []
  const have = []
  for (const { name, displayName } of recipeIngredientNames) {
    if (!name) continue
    const shoppingItem = byName.get(name)
    if (!shoppingItem) continue
    const entry = { displayName, name, shoppingItem }
    const status = str(field(shoppingItem, 'Status'))
    if (status === 'Have') have.push(entry)
    else need.push(entry)
  }
  return { need, have }
}
