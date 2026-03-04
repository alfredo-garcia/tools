import { useState, useEffect } from 'react'
import { IconX } from '@tools/shared'
import { usePlannerApi } from '../contexts/PlannerApiContext'
import { field, str, num, arr } from '@tools/shared'

const UNIT_OPTIONS = ['pcs', 'kg', 'L', 'pack', 'bag', 'cup', 'tbsp', 'tsp']

const INITIAL_FORM = {
  Ingredient: '',
  Quantity: '',
  Unit: '',
  'Optional Ingredient': false,
  Notes: '',
}

/**
 * Modal to add or edit a recipe ingredient (Recipe Ingredients table).
 * recipeId is required for create. For edit, pass existing recipeIngredient record.
 */
export function RecipeIngredientModal({ recipeId, recipeIngredient, ingredients = [], onClose, onSaved }) {
  const { fetchApi } = usePlannerApi()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(INITIAL_FORM)
  const isCreate = recipeIngredient == null

  useEffect(() => {
    if (recipeIngredient) {
      const ingId = arr(field(recipeIngredient, 'Ingredient'))[0]
      setForm({
        Ingredient: ingId || '',
        Quantity: num(field(recipeIngredient, 'Quantity')) !== null ? String(field(recipeIngredient, 'Quantity')) : '',
        Unit: str(field(recipeIngredient, 'Unit')) || '',
        'Optional Ingredient': Boolean(field(recipeIngredient, 'Optional Ingredient')),
        Notes: str(field(recipeIngredient, 'Notes')) || '',
      })
    } else {
      setForm({ ...INITIAL_FORM, Ingredient: '' })
    }
  }, [recipeIngredient])

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (isCreate && !recipeId) return
    const ingredientId = form.Ingredient.trim()
    if (!ingredientId) return
    setSaving(true)
    try {
      if (isCreate) {
        await fetchApi('/api/recipe-ingredients', {
          method: 'POST',
          body: JSON.stringify({
            Recipe: recipeId,
            Ingredient: ingredientId,
            Quantity: form.Quantity === '' ? undefined : Number(form.Quantity),
            Unit: form.Unit.trim() || undefined,
            'Optional Ingredient': form['Optional Ingredient'],
            Notes: form.Notes.trim() || undefined,
          }),
        })
        onSaved?.()
        onClose()
      } else {
        await fetchApi(`/api/recipe-ingredients/${recipeIngredient.id}`, {
          method: 'PATCH',
          body: JSON.stringify({
            Quantity: form.Quantity === '' ? undefined : Number(form.Quantity),
            Unit: form.Unit.trim() || undefined,
            'Optional Ingredient': form['Optional Ingredient'],
            Notes: form.Notes.trim() || undefined,
          }),
        })
        onSaved?.()
        onClose()
      }
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="recipe-ingredient-modal-title"
    >
      <div
        className="bg-surface rounded-2xl border-2 border-border shadow-xl max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-border flex items-center justify-between gap-3">
          <h2 id="recipe-ingredient-modal-title" className="font-bold text-xl text-text truncate flex-1">
            {isCreate ? 'Add ingredient' : 'Edit ingredient'}
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
        <form onSubmit={handleSubmit} className="px-6 py-5 overflow-y-auto flex-1 space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-muted mb-1.5">Ingredient</label>
            <select
              value={form.Ingredient}
              onChange={(e) => handleChange('Ingredient', e.target.value)}
              className="w-full rounded-lg border border-border bg-surface text-text px-3 py-2.5"
              required
              disabled={!isCreate}
            >
              <option value="">— Select —</option>
              {ingredients.map((ing) => {
                const name = str(field(ing, 'Name ES')) || str(field(ing, 'Name')) || ing.id
                return (
                  <option key={ing.id} value={ing.id}>
                    {name}
                  </option>
                )
              })}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-muted mb-1.5">Quantity</label>
            <input
              type="number"
              min="0"
              step="any"
              value={form.Quantity}
              onChange={(e) => handleChange('Quantity', e.target.value)}
              className="w-full rounded-lg border border-border bg-surface text-text px-3 py-2.5"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-muted mb-1.5">Unit</label>
            <select
              value={form.Unit}
              onChange={(e) => handleChange('Unit', e.target.value)}
              className="w-full rounded-lg border border-border bg-surface text-text px-3 py-2.5"
            >
              <option value="">—</option>
              {UNIT_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="optional-ingredient"
              checked={form['Optional Ingredient']}
              onChange={(e) => handleChange('Optional Ingredient', e.target.checked)}
              className="rounded border-border text-primary focus:ring-primary"
            />
            <label htmlFor="optional-ingredient" className="text-sm text-text">Optional ingredient</label>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-muted mb-1.5">Notes</label>
            <textarea
              value={form.Notes}
              onChange={(e) => handleChange('Notes', e.target.value)}
              className="w-full rounded-lg border border-border bg-surface text-text px-3 py-2.5 min-h-[60px] resize-y"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] px-4 rounded-xl text-sm font-medium bg-border text-text hover:bg-border/80"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="min-h-[44px] px-6 rounded-xl text-sm font-medium bg-primary text-white hover:bg-primary/90 disabled:opacity-50"
            >
              {saving ? 'Saving…' : isCreate ? 'Add' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
