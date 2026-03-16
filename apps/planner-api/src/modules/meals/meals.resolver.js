import { mealFromRecord } from '../../shared/mappers.js'

function toMealCreateFields(input) {
  const fields = { 'Meal Type': input.mealType, Date: input.date }
  if (input.meal != null) fields.Meal = input.meal
  else if (input.recipe != null) fields.Meal = input.recipe
  return fields
}

function toMealUpdateFields(input) {
  const fields = {}
  if (input.mealType != null) fields['Meal Type'] = input.mealType
  if (input.date != null) fields.Date = input.date
  if (input.meal != null) fields.Meal = input.meal
  if (input.clientLastModified != null) fields.clientLastModified = input.clientLastModified
  return fields
}

export function mealsResolvers(repos) {
  const meals = repos.meals
  return {
    Query: {
      async meals() {
        const list = await meals.list()
        return list.map(mealFromRecord)
      },
      async meal(_, { id }) {
        const r = await meals.getById(id)
        return mealFromRecord(r)
      },
    },
    Mutation: {
      async createMeal(_, { input }) {
        const { clientLastModified, ...rest } = toMealCreateFields(input)
        const r = await meals.create(rest)
        return mealFromRecord(r)
      },
      async updateMeal(_, { id, input }) {
        const { clientLastModified, ...update } = toMealUpdateFields(input)
        const r = await meals.update(id, update, { clientLastModified })
        return mealFromRecord(r)
      },
      async deleteMeal(_, { id }) {
        await meals.delete(id)
        return true
      },
    },
  }
}
