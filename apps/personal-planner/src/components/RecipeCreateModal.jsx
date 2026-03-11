import { useState } from 'react'
import { IconBook } from '@tools/shared'
import { usePlannerApi } from '../contexts/PlannerApiContext'
import { MEAL_TYPE_OPTIONS } from '../lib/mealsUtils'

const CUISINE_TYPE_OPTIONS = ['American', 'Asian', 'European', 'Middle Eastern', 'Mexican', 'Other', 'Spanish', 'Colombian', 'International']

/**
 * Modal to create a new Recipe (basic fields). On success calls onCreate(createdRecipe) then onClose.
 * Parent typically navigates to /recipes/:id for editing.
 */
export function RecipeCreateModal({ onClose, onCreate }) {
  const { fetchApi } = usePlannerApi()
  const [name, setName] = useState('')
  const [nameES, setNameES] = useState('')
  const [mealTypes, setMealTypes] = useState([]) // multi-select: array of strings
  const [cuisineType, setCuisineType] = useState('')
  const [timeToCook, setTimeToCook] = useState('')
  const [servings, setServings] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    const fields = {
      Name: name.trim() || '(untitled)',
      'Name ES': nameES.trim() || undefined,
      'Meal Type': mealTypes.length ? mealTypes : undefined,
      'Cuisine Type': cuisineType.trim() || undefined,
      'Time to Cook (minutes)': timeToCook === '' ? undefined : Number(timeToCook),
      Servings: servings === '' ? undefined : Number(servings),
      Description: description.trim() || undefined,
    }
    setSubmitting(true)
    try {
      const res = await fetchApi('/api/recipes', {
        method: 'POST',
        body: JSON.stringify(fields),
      })
      const created = res?.data
      if (created) onCreate(created)
      onClose()
    } catch (err) {
      console.error(err)
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
      aria-labelledby="recipe-create-modal-title"
    >
      <div
        className="bg-surface rounded-2xl border-2 border-border shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b border-border flex items-center justify-between gap-3">
          <h2 id="recipe-create-modal-title" className="font-bold text-xl text-text flex items-center gap-2">
            <IconBook size={22} />
            New recipe
          </h2>
          <button type="button" onClick={onClose} className="shrink-0 p-2 rounded-lg text-text-muted hover:bg-border text-xl leading-none" aria-label="Close">×</button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto flex-1 space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Recipe name"
              className="w-full rounded-lg border border-border bg-surface text-text px-3 py-2"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">Name (Spanish)</label>
            <input
              type="text"
              value={nameES}
              onChange={(e) => setNameES(e.target.value)}
              placeholder="Name in Spanish"
              className="w-full rounded-lg border border-border bg-surface text-text px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">Meal type (optional, multiple)</label>
            <div className="flex flex-wrap gap-2">
              {MEAL_TYPE_OPTIONS.map((opt) => (
                <label key={opt} className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={mealTypes.includes(opt)}
                    onChange={(e) => {
                      if (e.target.checked) setMealTypes((prev) => [...prev, opt])
                      else setMealTypes((prev) => prev.filter((t) => t !== opt))
                    }}
                    className="rounded border-border text-primary focus:ring-primary"
                  />
                  <span className="text-sm text-text">{opt}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">Cuisine type</label>
            <select
              value={cuisineType}
              onChange={(e) => setCuisineType(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface text-text px-3 py-2"
            >
              <option value="">—</option>
              {CUISINE_TYPE_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-muted mb-1">Time to cook (min)</label>
              <input
                type="number"
                min="0"
                value={timeToCook}
                onChange={(e) => setTimeToCook(e.target.value)}
                placeholder="—"
                className="w-full rounded-lg border border-border bg-surface text-text px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-muted mb-1">Servings</label>
              <input
                type="number"
                min="0"
                value={servings}
                onChange={(e) => setServings(e.target.value)}
                placeholder="—"
                className="w-full rounded-lg border border-border bg-surface text-text px-3 py-2"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description or steps"
              className="w-full rounded-lg border border-border bg-surface text-text px-3 py-2 min-h-[80px] resize-y"
            />
          </div>
          <div className="pt-2 flex justify-end gap-2">
            <button type="button" onClick={onClose} className="min-h-[44px] px-4 rounded-xl text-sm font-medium bg-border text-text hover:bg-border/80">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="min-h-[44px] px-6 rounded-xl text-sm font-medium bg-primary text-white hover:bg-primary/90 disabled:opacity-50">
              {submitting ? 'Creating…' : 'Create recipe'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
