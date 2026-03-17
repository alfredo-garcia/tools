import {
  IconBook,
  IconCoffee,
  IconChickenLeg,
  IconEggFried,
  IconCakeSlice,
  IconBottle,
  IconCookie,
  IconMartini,
} from '@tools/shared'

const MEAL_TYPE_ICON_MAP = {
  Breakfast: IconCoffee,
  Lunch: IconChickenLeg,
  Dinner: IconChickenLeg,
  Tapa: IconEggFried,
  Dessert: IconCakeSlice,
  Sauce: IconBottle,
  Cocktail: IconMartini,
  Snack: IconCookie,
}

const MEAL_TYPE_PRIORITY = [
  'Breakfast',
  'Lunch',
  'Dinner',
  'Tapa',
  'Dessert',
  'Sauce',
  'Cocktail',
  'Snack',
]

/**
 * Returns the dominant meal type for a recipe (first in priority that appears in recipe.mealType).
 */
export function getDominantMealType(recipe) {
  const types = Array.isArray(recipe?.mealType) ? recipe.mealType : []
  return MEAL_TYPE_PRIORITY.find((p) => types.includes(p)) || null
}

/**
 * Returns the icon component for a recipe (by dominant meal type).
 */
export function getRecipeMealTypeIcon(recipe) {
  const key = getDominantMealType(recipe)
  return MEAL_TYPE_ICON_MAP[key] || IconBook
}
