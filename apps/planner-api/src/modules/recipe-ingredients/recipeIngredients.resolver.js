import { recipeIngredientFromRecord } from '../../shared/mappers.js'

export function recipeIngredientsResolvers(repos) {
  const recipeIngredients = repos.recipeIngredients
  return {
    Query: {
      async recipeIngredients() {
        const list = await recipeIngredients.list()
        return list.map(recipeIngredientFromRecord)
      },
      async recipeIngredient(_, { id }) {
        const r = await recipeIngredients.getById(id)
        return recipeIngredientFromRecord(r)
      },
    },
  }
}

