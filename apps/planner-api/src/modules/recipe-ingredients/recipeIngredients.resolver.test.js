import { describe, it } from 'node:test'
import assert from 'node:assert'
import { recipeIngredientsResolvers } from './recipeIngredients.resolver.js'

describe('recipeIngredientsResolvers', () => {
  it('maps list() results via recipeIngredientFromRecord', async () => {
    const repos = {
      recipeIngredients: {
        async list() {
          return [
            {
              id: 'ri1',
              Recipe: ['recRecipe'],
              Ingredient: ['recIng'],
              Quantity: 1,
              Unit: 'pcs',
              'Optional Ingredient': false,
              Notes: 'note',
              lastModified: '2026-01-01T00:00:00.000Z',
            },
          ]
        },
        async getById() {
          throw new Error('not used')
        },
      },
    }

    const r = recipeIngredientsResolvers(repos)
    const out = await r.Query.recipeIngredients()
    assert.ok(Array.isArray(out))
    assert.strictEqual(out[0].id, 'ri1')
    assert.strictEqual(out[0].recipeId, 'recRecipe')
    assert.strictEqual(out[0].ingredientId, 'recIng')
    assert.strictEqual(out[0].unit, 'pcs')
  })

  it('maps getById() result via recipeIngredientFromRecord', async () => {
    const repos = {
      recipeIngredients: {
        async list() {
          throw new Error('not used')
        },
        async getById(id) {
          assert.strictEqual(id, 'ri2')
          return {
            id: 'ri2',
            Recipe: [],
            Ingredient: [],
            lastModified: 'x',
          }
        },
      },
    }

    const r = recipeIngredientsResolvers(repos)
    const out = await r.Query.recipeIngredient(null, { id: 'ri2' })
    assert.strictEqual(out.id, 'ri2')
    assert.strictEqual(out.recipeId, null)
    assert.strictEqual(out.ingredientId, null)
  })
})

