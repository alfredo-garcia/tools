import { describe, it, expect } from 'vitest'
import { getMealsForSlot, recipeMatchesMealType } from './mealsUtils.js'

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
})
