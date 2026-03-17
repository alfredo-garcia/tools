import { useState, useEffect, useMemo } from 'react'
import { Modal, Spinner, Card, IconSearch } from '@tools/shared'
import { usePlannerApi } from '../contexts/PlannerApiContext'
import { MealIngredientsShoppingModal } from './MealIngredientsShoppingModal'

const RECIPES_QUERY = `
  query { recipes { id name nameES mealType description cuisineType tags } }
`

const RECIPE_INGREDIENTS_QUERY = `
  query { recipeIngredients { id recipeId ingredientId quantity unit optionalIngredient notes } }
`
const INGREDIENTS_QUERY = `
  query { ingredients { id name nameES } }
`
const SHOPPING_QUERY = `
  query { shopping { id name nameES status } }
`

const CREATE_MEAL = `
  mutation CreateMeal($input: MealCreateInput!) {
    createMeal(input: $input) { id mealType date meal }
  }
`

const CREATE_SHOPPING_ITEM = `
  mutation CreateShoppingItem($input: ShoppingItemCreateInput!) {
    createShoppingItem(input: $input) { id name status }
  }
`
const UPDATE_SHOPPING_ITEM = `
  mutation UpdateShoppingItem($id: ID!, $input: ShoppingItemUpdateInput!) {
    updateShoppingItem(id: $id, input: $input) { id status }
  }
`

const MEAL_SLOTS = ['Breakfast', 'Lunch', 'Dinner']
const MEAL_TYPE_OPTIONS = ['Breakfast', 'Lunch', 'Dinner', 'Sauce', 'Dessert', 'Snack', 'Tapa']
const FILTER_ALL = 'All'
const FILTER_OPTIONS = [...MEAL_TYPE_OPTIONS, FILTER_ALL]

function recipeMatchesMealType(recipe, filter) {
  if (filter === FILTER_ALL) return true
  const types = Array.isArray(recipe.mealType) ? recipe.mealType : []
  return types.includes(filter)
}

function normalizeName(s) {
  return String(s || '').trim().toLowerCase()
}

/**
 * Modal to add a meal to a slot: date, meal type, filter, search, list of recipes. Select recipe → createMeal.
 */
export function AddMealModal({ dateStr, mealType, onClose, onAdded }) {
  const { graphql } = usePlannerApi()
  const [recipes, setRecipes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [filter, setFilter] = useState(mealType || MEAL_SLOTS[0])
  const [search, setSearch] = useState('')
  const [ingredientsModal, setIngredientsModal] = useState(null)

  useEffect(() => {
    setFilter(mealType || MEAL_SLOTS[0])
  }, [mealType])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    graphql(RECIPES_QUERY)
      .then((data) => {
        if (!cancelled) setRecipes(data?.recipes ?? [])
      })
      .catch((e) => {
        if (!cancelled) setError(e.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [graphql])

  const filteredRecipes = useMemo(() => {
    let list = filter === FILTER_ALL ? recipes : recipes.filter((r) => recipeMatchesMealType(r, filter))
    const q = search.trim().toLowerCase()
    if (!q) return list
    return list.filter((r) => {
      const name = ((r.name || '') + ' ' + (r.nameES || '')).toLowerCase()
      const desc = (r.description || '').toLowerCase()
      const tags = (r.tags || '').toLowerCase()
      const meal = Array.isArray(r.mealType) ? r.mealType.join(' ').toLowerCase() : ''
      const cuisine = (r.cuisineType || '').toLowerCase()
      return name.includes(q) || desc.includes(q) || tags.includes(q) || meal.includes(q) || cuisine.includes(q)
    })
  }, [recipes, filter, search])

  const createMeal = async (recipe) => {
    await graphql(CREATE_MEAL, {
      input: {
        mealType: mealType || filter,
        date: dateStr,
        meal: recipe.id,
      },
    })
    onAdded?.()
    onClose?.()
  }

  const handleSelectRecipe = async (recipe) => {
    setSubmitting(true)
    setError(null)
    try {
      const [riData, ingData, shopData] = await Promise.all([
        graphql(RECIPE_INGREDIENTS_QUERY),
        graphql(INGREDIENTS_QUERY),
        graphql(SHOPPING_QUERY),
      ])

      const recipeIngredients = riData?.recipeIngredients ?? []
      const ingredients = ingData?.ingredients ?? []
      const shopping = shopData?.shopping ?? []

      const ingredientById = new Map(ingredients.map((i) => [i.id, i]))
      const shoppingByName = new Map(shopping.map((s) => [normalizeName(s.name), s]))

      const items = recipeIngredients
        .filter((ri) => ri.recipeId === recipe.id && ri.ingredientId)
        .map((ri) => {
          const ing = ingredientById.get(ri.ingredientId)
          const name = (ing?.name || '').trim()
          const nameES = (ing?.nameES || '').trim()
          const shoppingItem = name ? shoppingByName.get(normalizeName(name)) : null
          return {
            ingredientId: ri.ingredientId,
            name: name || '(ingredient)',
            nameES: nameES || undefined,
            optionalIngredient: Boolean(ri.optionalIngredient),
            shoppingItem: shoppingItem || undefined,
          }
        })
        .filter((it) => it.name)

      if (items.length > 0) {
        const recipeTitle = [recipe.nameES, recipe.name].filter(Boolean).join(' — ') || recipe.name || 'Recipe'
        setIngredientsModal({ recipe, recipeTitle, items })
        return
      }

      await createMeal(recipe)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const formatDateLabel = (d) => {
    if (!d) return ''
    const date = new Date(d + 'T12:00:00')
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    return `${days[date.getDay()]} ${date.getDate()}/${date.getMonth() + 1}`
  }

  return (
    <>
      <Modal
        open={true}
        onClose={onClose}
        title={`Add meal — ${formatDateLabel(dateStr)} · ${mealType || filter}`}
        ariaLabelledBy="add-meal-modal-title"
      >
        <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <label className="text-sm text-text-muted shrink-0">Meal type:</label>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="rounded border border-border bg-surface text-text px-2 py-1 text-sm"
          >
            {FILTER_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none">
            <IconSearch size={18} />
          </span>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search recipes…"
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-surface text-text text-sm"
          />
        </div>
        {error && (
          <p className="text-red-600 dark:text-red-400 text-sm" role="alert">
            {error}
          </p>
        )}
        {loading ? (
          <div className="flex justify-center py-8">
            <Spinner />
          </div>
        ) : (
          <ul className="space-y-2 max-h-[50vh] overflow-y-auto list-none p-0 m-0">
            {filteredRecipes.map((r) => (
              <li key={r.id}>
                <Card
                  title={[r.nameES, r.name].filter(Boolean).join(' — ') || r.name || '(untitled)'}
                  className="cursor-pointer hover:ring-2 hover:ring-primary/30 transition-shadow"
                  onClick={() => !submitting && handleSelectRecipe(r)}
                >
                  {Array.isArray(r.mealType) && r.mealType.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {r.mealType.slice(0, 3).map((mt) => (
                        <span key={mt} className="text-xs px-1.5 py-0.5 rounded bg-border text-text-muted">
                          {mt}
                        </span>
                      ))}
                    </div>
                  )}
                </Card>
              </li>
            ))}
          </ul>
        )}
        {filteredRecipes.length === 0 && !loading && (
          <p className="text-text-muted text-sm">No recipes match.</p>
        )}
        </div>
      </Modal>

      {ingredientsModal?.recipe && (
        <MealIngredientsShoppingModal
          open={true}
          title={`Ingredients — ${ingredientsModal.recipeTitle}`}
          items={ingredientsModal.items}
          onClose={() => setIngredientsModal(null)}
          onSkip={async () => {
            const r = ingredientsModal.recipe
            setIngredientsModal(null)
            setSubmitting(true)
            try {
              await createMeal(r)
            } catch (err) {
              setError(err.message)
            } finally {
              setSubmitting(false)
            }
          }}
          onConfirm={async ({ creates, updates }) => {
            const r = ingredientsModal.recipe
            setSubmitting(true)
            try {
              if (Array.isArray(updates) && updates.length > 0) {
                await Promise.all(
                  updates.map((u) => graphql(UPDATE_SHOPPING_ITEM, { id: u.id, input: { status: u.status } }))
                )
              }
              if (Array.isArray(creates) && creates.length > 0) {
                await Promise.all(
                  creates.map((c) =>
                    graphql(CREATE_SHOPPING_ITEM, { input: { name: c.name, nameES: c.nameES, status: c.status } })
                  )
                )
              }
              setIngredientsModal(null)
              await createMeal(r)
            } catch (err) {
              setError(err.message)
            } finally {
              setSubmitting(false)
            }
          }}
        />
      )}
    </>
  )
}
