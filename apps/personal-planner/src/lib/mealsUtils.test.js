import { describe, it, expect } from 'vitest'
import {
  getMealsForSlot,
  recipeMatchesMealType,
  getRecipeIngredientNames,
  getMissingIngredients,
} from './mealsUtils.js'

describe('mealsUtils', () => {
  describe('getMealsForSlot', () => {
    it('returns meals for the given day and meal type', () => {
      const meals = [
        { id: '1', Date: '2025-03-03', 'Meal Type': 'Breakfast', Meal: 'recA' },
        { id: '2', Date: '2025-03-03', 'Meal Type': 'Lunch', Meal: 'recB' },
        { id: '3', Date: '2025-03-04', 'Meal Type': 'Breakfast', Meal: 'recC' },
      ]
      const result = getMealsForSlot(meals, '2025-03-03', 'Breakfast')
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('1')
    })

    it('returns empty array when no meals match', () => {
      const meals = [
        { id: '1', Date: '2025-03-03', 'Meal Type': 'Lunch', Meal: 'recB' },
      ]
      expect(getMealsForSlot(meals, '2025-03-03', 'Breakfast')).toEqual([])
      expect(getMealsForSlot(meals, '2025-03-04', 'Lunch')).toEqual([])
    })

    it('handles non-array meals', () => {
      expect(getMealsForSlot(null, '2025-03-03', 'Breakfast')).toEqual([])
      expect(getMealsForSlot(undefined, '2025-03-03', 'Breakfast')).toEqual([])
    })
  })

  describe('recipeMatchesMealType', () => {
    it('returns true when recipe Meal Type equals meal type', () => {
      expect(recipeMatchesMealType({ 'Meal Type': 'Breakfast' }, 'Breakfast')).toBe(true)
      expect(recipeMatchesMealType({ 'Meal Type': 'Lunch' }, 'Lunch')).toBe(true)
      expect(recipeMatchesMealType({ 'Meal Type': 'Dinner' }, 'Dinner')).toBe(true)
    })

    it('returns true when recipe Meal Type is array containing the type', () => {
      expect(recipeMatchesMealType({ 'Meal Type': ['Breakfast', 'Snack'] }, 'Breakfast')).toBe(true)
      expect(recipeMatchesMealType({ 'Meal Type': ['Lunch'] }, 'Lunch')).toBe(true)
    })

    it('returns false when recipe does not match', () => {
      expect(recipeMatchesMealType({ 'Meal Type': 'Lunch' }, 'Breakfast')).toBe(false)
      expect(recipeMatchesMealType({ 'Meal Type': ['Snack'] }, 'Dinner')).toBe(false)
      expect(recipeMatchesMealType({}, 'Breakfast')).toBe(false)
    })

    it('returns false when recipe or mealType is missing', () => {
      expect(recipeMatchesMealType(null, 'Breakfast')).toBe(false)
      expect(recipeMatchesMealType({ 'Meal Type': 'Breakfast' }, '')).toBe(false)
    })
  })

  describe('getRecipeIngredientNames', () => {
    it('returns name and displayName for each recipe ingredient', () => {
      const recipeId = 'rec1'
      const recipeIngredients = [
        { id: 'ri1', Recipe: ['rec1'], Ingredient: ['ing1'] },
        { id: 'ri2', Recipe: ['rec1'], Ingredient: ['ing2'] },
      ]
      const ingredients = [
        { id: 'ing1', Name: 'Tomato', 'Name ES': 'Tomate' },
        { id: 'ing2', Name: 'Onion', 'Name ES': '' },
      ]
      const result = getRecipeIngredientNames(recipeId, recipeIngredients, ingredients)
      expect(result).toHaveLength(2)
      expect(result[0]).toEqual({ name: 'Tomato', displayName: 'Tomate' })
      expect(result[1]).toEqual({ name: 'Onion', displayName: 'Onion' })
    })

    it('filters by recipe id and deduplicates by name', () => {
      const recipeIngredients = [
        { id: 'ri1', Recipe: ['rec1'], Ingredient: ['ing1'] },
        { id: 'ri2', Recipe: ['rec2'], Ingredient: ['ing2'] },
        { id: 'ri3', Recipe: ['rec1'], Ingredient: ['ing1'] },
      ]
      const ingredients = [
        { id: 'ing1', Name: 'Salt', 'Name ES': 'Sal' },
        { id: 'ing2', Name: 'Pepper', 'Name ES': 'Pimienta' },
      ]
      const result = getRecipeIngredientNames('rec1', recipeIngredients, ingredients)
      expect(result).toHaveLength(1)
      expect(result[0].name).toBe('Salt')
    })

    it('returns empty array when no recipe id or invalid inputs', () => {
      expect(getRecipeIngredientNames('', [], [])).toEqual([])
      expect(getRecipeIngredientNames('rec1', null, [])).toEqual([])
      expect(getRecipeIngredientNames('rec1', [], null)).toEqual([])
    })
  })

  describe('getMissingIngredients', () => {
    it('returns ingredients not in shopping list or not Have', () => {
      const recipeIngredientNames = [
        { name: 'Tomato', displayName: 'Tomate' },
        { name: 'Onion', displayName: 'Cebolla' },
        { name: 'Garlic', displayName: 'Ajo' },
      ]
      const shoppingList = [
        { id: 's1', Name: 'Tomato', Status: 'Have' },
        { id: 's2', Name: 'Onion', Status: 'Need' },
      ]
      const result = getMissingIngredients(recipeIngredientNames, shoppingList)
      expect(result).toHaveLength(2)
      expect(result[0]).toMatchObject({ displayName: 'Cebolla', name: 'Onion' })
      expect(result[0].shoppingItem).toBeDefined()
      expect(result[0].shoppingItem.id).toBe('s2')
      expect(result[1]).toMatchObject({ displayName: 'Ajo', name: 'Garlic' })
      expect(result[1].shoppingItem).toBeUndefined()
    })

    it('returns empty when all ingredients are Have', () => {
      const recipeIngredientNames = [{ name: 'Tomato', displayName: 'Tomate' }]
      const shoppingList = [{ id: 's1', Name: 'Tomato', Status: 'Have' }]
      expect(getMissingIngredients(recipeIngredientNames, shoppingList)).toEqual([])
    })

    it('handles non-array inputs', () => {
      expect(getMissingIngredients(null, [])).toEqual([])
      expect(getMissingIngredients([], null)).toEqual([])
    })
  })
})
