import { useState, useEffect, useMemo } from 'react'
import { Modal, Spinner, Card, IconSearch, IconTrash } from '@tools/shared'
import { usePlannerApi } from '../contexts/PlannerApiContext'

const RECIPES_QUERY = `
  query { recipes { id name nameES mealType description cuisineType tags } }
`

const UPDATE_MEAL = `
  mutation UpdateMeal($id: ID!, $input: MealUpdateInput!) {
    updateMeal(id: $id, input: $input) { id meal mealType date }
  }
`
const DELETE_MEAL = `
  mutation DeleteMeal($id: ID!) { deleteMeal(id: $id) }
`

const MEAL_TYPE_OPTIONS = ['Breakfast', 'Lunch', 'Dinner', 'Sauce', 'Dessert', 'Snack', 'Tapa']
const FILTER_ALL = 'All'
const FILTER_OPTIONS = [...MEAL_TYPE_OPTIONS, FILTER_ALL]

function recipeMatchesMealType(recipe, filter) {
  if (filter === FILTER_ALL) return true
  const types = Array.isArray(recipe.mealType) ? recipe.mealType : []
  return types.includes(filter)
}

/**
 * Modal when clicking a meal: current recipe, replace with another recipe or delete meal.
 */
export function EditMealModal({ meal, dateStr, mealType, recipeName, onClose, onUpdated, onDeleted }) {
  const { graphql } = usePlannerApi()
  const [recipes, setRecipes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [filter, setFilter] = useState(mealType || MEAL_TYPE_OPTIONS[0])
  const [search, setSearch] = useState('')

  useEffect(() => {
    setFilter(mealType || MEAL_TYPE_OPTIONS[0])
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
      const mealStr = Array.isArray(r.mealType) ? r.mealType.join(' ').toLowerCase() : ''
      const cuisine = (r.cuisineType || '').toLowerCase()
      return name.includes(q) || desc.includes(q) || tags.includes(q) || mealStr.includes(q) || cuisine.includes(q)
    })
  }, [recipes, filter, search])

  const handleReplaceWithRecipe = async (recipe) => {
    setSubmitting(true)
    setError(null)
    try {
      await graphql(UPDATE_MEAL, { id: meal.id, input: { meal: recipe.id } })
      onUpdated?.()
      onClose?.()
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    setError(null)
    try {
      await graphql(DELETE_MEAL, { id: meal.id })
      onDeleted?.()
      onClose?.()
    } catch (err) {
      setError(err.message)
    } finally {
      setDeleting(false)
    }
  }

  const formatDateLabel = (d) => {
    if (!d) return ''
    const date = new Date(d + 'T12:00:00')
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    return `${days[date.getDay()]} ${date.getDate()}/${date.getMonth() + 1}`
  }

  return (
    <Modal
      open={true}
      onClose={onClose}
      title={`Edit meal — ${formatDateLabel(dateStr)} · ${mealType}`}
      ariaLabelledBy="edit-meal-modal-title"
    >
      <div className="space-y-4">
        <div className="p-3 rounded-lg bg-surface border border-border">
          <p className="text-sm font-medium text-text-muted">Current</p>
          <p className="text-text font-medium">{recipeName || '(no recipe)'}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-red-500/50 text-red-600 dark:text-red-400 hover:bg-red-500/10 disabled:opacity-50"
          >
            <IconTrash size={18} />
            Borrar
          </button>
        </div>
        <hr className="border-border" />
        <div className="flex flex-wrap items-center gap-2">
          <label className="text-sm text-text-muted shrink-0">Meal type filter:</label>
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
          <>
            <p className="text-sm text-text-muted">Replace with:</p>
            <ul className="space-y-2 max-h-[40vh] overflow-y-auto list-none p-0 m-0">
              {filteredRecipes.map((r) => (
                <li key={r.id}>
                  <Card
                    title={[r.nameES, r.name].filter(Boolean).join(' — ') || r.name || '(untitled)'}
                    className="cursor-pointer hover:ring-2 hover:ring-primary/30 transition-shadow"
                    onClick={() => !submitting && handleReplaceWithRecipe(r)}
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
          </>
        )}
      </div>
    </Modal>
  )
}
