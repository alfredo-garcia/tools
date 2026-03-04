import { useState, useEffect, useMemo } from 'react'
import { Spinner, Card, IconBook, IconX } from '@tools/shared'
import { usePlannerApi } from '../contexts/PlannerApiContext'
import { field, str } from '@tools/shared'
import { recipeMatchesMealType } from '../lib/mealsUtils'

/**
 * Modal to add a meal to a slot: shows date, meal type, and list of recipes (Cards) that match the meal type.
 * Clicking a recipe creates the meal in Airtable and calls onAdded then onClose.
 */
export function AddMealModal({ dateStr, mealType, onClose, onAdded }) {
  const { fetchApi } = usePlannerApi()
  const [recipes, setRecipes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const filteredRecipes = useMemo(() => {
    if (!mealType) return []
    return recipes.filter((r) => recipeMatchesMealType(r, mealType))
  }, [recipes, mealType])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    fetchApi('/api/recipes')
      .then((r) => {
        if (!cancelled) setRecipes(r.data || [])
      })
      .catch((e) => {
        if (!cancelled) setError(e.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [fetchApi])

  const formatDateLabel = (d) => {
    if (!d) return ''
    const date = new Date(d + 'T12:00:00')
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    return `${days[date.getDay()]} ${date.getDate()}/${date.getMonth() + 1}`
  }

  const handleSelectRecipe = async (recipe) => {
    setSubmitting(true)
    try {
      await fetchApi('/api/meals', {
        method: 'POST',
        body: JSON.stringify({
          'Meal Type': mealType,
          Date: dateStr,
          Meal: recipe.id,
        }),
      })
      onAdded?.()
      onClose()
    } catch (err) {
      console.error(err)
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-meal-modal-title"
    >
      <div
        className="bg-surface rounded-2xl border-2 border-border shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-border flex items-center justify-between gap-3">
          <h2 id="add-meal-modal-title" className="font-bold text-xl text-text">
            Add meal — {formatDateLabel(dateStr)} · {mealType}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 p-2 rounded-lg text-text-muted hover:bg-border text-xl leading-none"
            aria-label="Close"
          >
            <IconX size={20} />
          </button>
        </div>
        <div className="p-6 overflow-y-auto flex-1">
          {loading && (
            <div className="flex justify-center py-8">
              <Spinner size="lg" />
            </div>
          )}
          {error && (
            <p className="text-red-600 dark:text-red-400 text-sm mb-4">{error}</p>
          )}
          {!loading && (
            <p className="text-sm text-text-muted mb-4">Choose a recipe to add to this slot:</p>
          )}
          {!loading && filteredRecipes.length === 0 && !error && (
            <p className="text-text-muted">No recipes for {mealType}. Add Meal Type to your recipes in Airtable.</p>
          )}
          {!loading && filteredRecipes.length > 0 && (
            <ul className="space-y-2">
              {filteredRecipes.map((recipe) => {
                const name = str(field(recipe, 'Name')) || str(field(recipe, 'Name ES')) || '(untitled)'
                const nameES = str(field(recipe, 'Name ES'))
                const title = nameES && name !== nameES ? `${nameES} — ${name}` : name
                return (
                  <li key={recipe.id}>
                    <button
                      type="button"
                      onClick={() => handleSelectRecipe(recipe)}
                      disabled={submitting}
                      className="w-full text-left rounded-xl bg-surface border border-border hover:ring-2 hover:ring-primary/30 transition-shadow p-4 disabled:opacity-50"
                    >
                      <Card title={title} icon={<IconBook size={20} />}>
                        <span className="text-sm text-text-muted">Click to add</span>
                      </Card>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
