import { useState, useEffect, useMemo } from 'react'
import { Spinner, Card, IconBook, IconX, IconTrash } from '@tools/shared'
import { usePlannerApi } from '../contexts/PlannerApiContext'
import { field, str } from '@tools/shared'
import { recipeMatchesMealType } from '../lib/mealsUtils'

/**
 * Modal when clicking a meal card: shows date, meal type, current meal with "Borrar", and list of recipes.
 * Clicking a recipe replaces the current meal (PATCH). Borrar deletes the meal (DELETE).
 */
export function EditMealModal({ meal, dateStr, mealType, recipeName, onClose, onUpdated, onDeleted }) {
  const { fetchApi } = usePlannerApi()
  const [recipes, setRecipes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(false)

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

  const handleReplaceWithRecipe = async (recipe) => {
    setSubmitting(true)
    try {
      await fetchApi(`/api/meals/${meal.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ Meal: recipe.id }),
      })
      onUpdated?.()
      onClose()
    } catch (err) {
      console.error(err)
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('¿Borrar esta comida?')) return
    setDeleting(true)
    try {
      await fetchApi(`/api/meals/${meal.id}`, { method: 'DELETE' })
      onDeleted?.()
      onClose()
    } catch (err) {
      console.error(err)
      setError(err.message)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-meal-modal-title"
    >
      <div
        className="bg-surface rounded-2xl border-2 border-border shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-border flex items-center justify-between gap-3">
          <h2 id="edit-meal-modal-title" className="font-bold text-xl text-text">
            Meal — {formatDateLabel(dateStr)} · {mealType}
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
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          <div className="flex items-center justify-between gap-3 rounded-xl bg-surface border border-border p-4">
            <span className="font-medium text-text">{recipeName || '(sin receta)'}</span>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-500/10 disabled:opacity-50"
            >
              <IconTrash size={18} />
              Borrar
            </button>
          </div>
          {error && (
            <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
          )}
          <p className="text-sm text-text-muted">Replace with another recipe:</p>
          {loading && (
            <div className="flex justify-center py-4">
              <Spinner size="lg" />
            </div>
          )}
          {!loading && filteredRecipes.length === 0 && !error && (
            <p className="text-text-muted">No other recipes for {mealType}.</p>
          )}
          {!loading && filteredRecipes.length > 0 && (
            <ul className="space-y-2">
              {filteredRecipes.map((recipe) => {
                const name = str(field(recipe, 'Name')) || str(field(recipe, 'Name ES')) || '(untitled)'
                const nameES = str(field(recipe, 'Name ES'))
                const title = nameES && name !== nameES ? `${nameES} — ${name}` : name
                const isCurrent = meal && (field(meal, 'Meal', 'Recipe') === recipe.id || meal.Meal === recipe.id)
                return (
                  <li key={recipe.id}>
                    <button
                      type="button"
                      onClick={() => !isCurrent && handleReplaceWithRecipe(recipe)}
                      disabled={submitting || isCurrent}
                      className="w-full text-left rounded-xl bg-surface border border-border hover:ring-2 hover:ring-primary/30 transition-shadow p-4 disabled:opacity-50"
                    >
                      <Card title={title} icon={<IconBook size={20} />}>
                        {isCurrent ? (
                          <span className="text-sm text-text-muted">Current</span>
                        ) : (
                          <span className="text-sm text-text-muted">Click to use this recipe</span>
                        )}
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
