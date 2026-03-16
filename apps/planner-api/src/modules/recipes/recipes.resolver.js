import { recipeFromRecord, ingredientFromRecord } from '../../shared/mappers.js'

function toRecipeFields(input, forCreate) {
  const fields = {}
  if (input.name != null) fields.Name = input.name
  if (input.nameES != null) fields['Name ES'] = input.nameES
  if (input.description != null) fields.Description = input.description
  if (input.mealType != null) fields['Meal Type'] = input.mealType
  if (input.cookingProcess != null) fields['Cooking Process'] = input.cookingProcess
  if (input.complexityRating != null) fields['Complexity Rating'] = input.complexityRating
  if (input.nutrientRating != null) fields['Nutrient Rating'] = input.nutrientRating
  if (input.timeToCookMinutes != null) fields['Time to Cook (minutes)'] = input.timeToCookMinutes
  if (input.servings != null) fields.Servings = input.servings
  if (input.cuisineType != null) fields['Cuisine Type'] = input.cuisineType
  if (input.sourceUrl != null) fields['Source/URL'] = input.sourceUrl
  if (input.tags != null) fields.Tags = input.tags
  if (input.clientLastModified != null && !forCreate) fields.clientLastModified = input.clientLastModified
  return fields
}

function toIngredientFields(input, forCreate) {
  const fields = {}
  if (input.name != null) fields.Name = input.name
  if (input.nameES != null) fields['Name ES'] = input.nameES
  if (input.description != null) fields.Description = input.description
  if (input.category != null) fields.Category = input.category
  if (input.unit != null) fields.Unit = input.unit
  if (input.notes != null) fields.Notes = input.notes
  if (input.clientLastModified != null && !forCreate) fields.clientLastModified = input.clientLastModified
  return fields
}

export function recipesResolvers(repos) {
  const recipes = repos.recipes
  const ingredients = repos.ingredients
  return {
    Query: {
      async recipes() {
        const list = await recipes.list()
        return list.map(recipeFromRecord)
      },
      async recipe(_, { id }) {
        const r = await recipes.getById(id)
        return recipeFromRecord(r)
      },
      async ingredients() {
        const list = await ingredients.list()
        return list.map(ingredientFromRecord)
      },
      async ingredient(_, { id }) {
        const r = await ingredients.getById(id)
        return ingredientFromRecord(r)
      },
    },
    Mutation: {
      async createRecipe(_, { input }) {
        const { clientLastModified, ...rest } = toRecipeFields(input, true)
        const r = await recipes.create(rest)
        return recipeFromRecord(r)
      },
      async updateRecipe(_, { id, input }) {
        const { clientLastModified, ...update } = toRecipeFields(input, false)
        const r = await recipes.update(id, update, { clientLastModified })
        return recipeFromRecord(r)
      },
      async deleteRecipe(_, { id }) {
        await recipes.delete(id)
        return true
      },
    },
  }
}
