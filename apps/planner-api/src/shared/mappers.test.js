import { describe, it } from 'node:test'
import assert from 'node:assert'
import { habitFromRecord, recipeIngredientFromRecord } from './mappers.js'

describe('habitFromRecord', () => {
  it('maps id, name, description, frequency, lastModified', () => {
    const r = {
      id: 'rec1',
      Name: 'Exercise',
      Description: 'Daily run',
      Frequency: 'Daily',
      lastModified: '2025-01-01T00:00:00.000Z',
    }
    const out = habitFromRecord(r)
    assert.strictEqual(out.id, 'rec1')
    assert.strictEqual(out.name, 'Exercise')
    assert.strictEqual(out.description, 'Daily run')
    assert.strictEqual(out.frequency, 'Daily')
    assert.strictEqual(out.lastModified, '2025-01-01T00:00:00.000Z')
  })

  it('maps category and type from Airtable fields', () => {
    const r = {
      id: 'rec2',
      'Habit Name': 'No smoking',
      Category: 'Health',
      'Habit Type': 'Bad',
      lastModified: '2025-01-01T00:00:00.000Z',
    }
    const out = habitFromRecord(r)
    assert.strictEqual(out.category, 'Health')
    assert.strictEqual(out.type, 'Bad')
  })

  it('uses Habit type when Habit Type is missing', () => {
    const r = {
      id: 'rec3',
      Name: 'Read',
      'Habit type': 'Good',
      lastModified: '2025-01-01T00:00:00.000Z',
    }
    const out = habitFromRecord(r)
    assert.strictEqual(out.type, 'Good')
  })

  it('returns null for null input', () => {
    assert.strictEqual(habitFromRecord(null), null)
  })
})

describe('recipeIngredientFromRecord', () => {
  it('maps ids and fields from Airtable-ish record', () => {
    const r = {
      id: 'ri1',
      Recipe: ['recRecipe'],
      Ingredient: ['recIng'],
      Quantity: 2,
      Unit: 'pcs',
      'Optional Ingredient': true,
      Notes: 'chopped',
      lastModified: '2026-01-01T00:00:00.000Z',
    }
    const out = recipeIngredientFromRecord(r)
    assert.strictEqual(out.id, 'ri1')
    assert.strictEqual(out.recipeId, 'recRecipe')
    assert.strictEqual(out.ingredientId, 'recIng')
    assert.strictEqual(out.quantity, 2)
    assert.strictEqual(out.unit, 'pcs')
    assert.strictEqual(out.optionalIngredient, true)
    assert.strictEqual(out.notes, 'chopped')
    assert.strictEqual(out.lastModified, '2026-01-01T00:00:00.000Z')
  })

  it('handles missing links', () => {
    const out = recipeIngredientFromRecord({ id: 'ri2', lastModified: 'x' })
    assert.strictEqual(out.recipeId, null)
    assert.strictEqual(out.ingredientId, null)
    assert.strictEqual(out.optionalIngredient, false)
  })
})
