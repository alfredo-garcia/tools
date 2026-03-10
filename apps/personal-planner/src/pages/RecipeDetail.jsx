import { useState, useEffect, useCallback, useMemo } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  Spinner,
  PageHeader,
  IconBook,
  IconTrash,
  Fab,
  field,
  str,
  num,
  arr,
} from '@tools/shared'
import { usePlannerApi } from '../contexts/PlannerApiContext'
import { RecipeIngredientModal } from '../components/RecipeIngredientModal'
import { MEAL_TYPE_OPTIONS } from '../lib/mealsUtils'

const CUISINE_TYPE_OPTIONS = ['American', 'Asian', 'European', 'Middle Eastern', 'Mexican', 'Other', 'Spanish', 'Colombian', 'International']

function RecipeIngredientRow({ recipeIngredient, ingredientMap, onDelete, onEdit }) {
  const ingredientId = arr(field(recipeIngredient, 'Ingredient'))[0]
  const ingredient = ingredientMap.get(ingredientId)
  const name = ingredient
    ? (str(field(ingredient, 'Name ES')) || str(field(ingredient, 'Name')) || '(ingredient)')
    : '(ingredient)'
  const quantity = num(field(recipeIngredient, 'Quantity'))
  const unit = str(field(recipeIngredient, 'Unit'))
  const optional = Boolean(field(recipeIngredient, 'Optional Ingredient'))
  const notes = str(field(recipeIngredient, 'Notes'))
  const line = [quantity != null && quantity !== '' ? String(quantity) : null, unit].filter(Boolean).join(' ')
  const hasDetails = ingredient || notes

  return (
    <div className="rounded-xl bg-surface border border-border overflow-hidden">
      <div className="p-4 flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="font-medium text-text flex items-center gap-2">
            {name}
            {optional && (
              <span className="text-xs font-normal px-1.5 py-0.5 rounded bg-border text-text-muted">optional</span>
            )}
          </div>
          {line && <div className="text-sm text-text-muted mt-0.5">{line}</div>}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => onEdit(recipeIngredient)}
            className="p-2 rounded-lg text-text-muted hover:bg-border hover:text-text text-xs font-medium"
            aria-label="Edit ingredient"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => onDelete(recipeIngredient.id)}
            className="p-2 rounded-lg text-text-muted hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400"
            aria-label="Remove ingredient"
          >
            <IconTrash size={18} />
          </button>
        </div>
      </div>
      {hasDetails && (
        <div className="px-4 pb-4 pt-0 border-t border-border text-sm text-text-muted space-y-2">
          {ingredient && (
            <>
              {str(field(ingredient, 'Description')) && (
                <p>{str(field(ingredient, 'Description'))}</p>
              )}
              {str(field(ingredient, 'Category')) && (
                <p><span className="font-medium text-text">Category:</span> {str(field(ingredient, 'Category'))}</p>
              )}
              {str(field(ingredient, 'Notes')) && (
                <p><span className="font-medium text-text">Notes:</span> {str(field(ingredient, 'Notes'))}</p>
              )}
            </>
          )}
          {notes && (
            <p><span className="font-medium text-text">Recipe note:</span> {notes}</p>
          )}
        </div>
      )}
    </div>
  )
}

export function RecipeDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { fetchApi, invalidateCache } = usePlannerApi()
  const [recipe, setRecipe] = useState(null)
  const [recipeIngredients, setRecipeIngredients] = useState([])
  const [ingredients, setIngredients] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [addIngredientOpen, setAddIngredientOpen] = useState(false)
  const [editIngredient, setEditIngredient] = useState(null)
  const [editingField, setEditingField] = useState(null)
  const [editValue, setEditValue] = useState('')

  const refetch = useCallback((silent = false) => {
    if (!silent) {
      setLoading(true)
      setError(null)
    }
    const base = [
      fetchApi(`/api/recipes/${id}`).then((r) => r.data),
      fetchApi('/api/recipe-ingredients').then((r) => r.data || []),
      fetchApi('/api/ingredients').then((r) => r.data || []),
    ]
    return Promise.all(base)
      .then(([rec, riList, ingList]) => {
        setRecipe(rec || null)
        setRecipeIngredients(Array.isArray(riList) ? riList.filter((ri) => arr(field(ri, 'Recipe')).includes(id)) : [])
        setIngredients(Array.isArray(ingList) ? ingList : [])
      })
      .catch((e) => {
        setError(e.message)
      })
      .finally(() => setLoading(false))
  }, [fetchApi, id])

  const handleRefresh = useCallback(() => {
    invalidateCache('/api/recipes')
    invalidateCache('/api/recipe-ingredients')
    invalidateCache('/api/ingredients')
    refetch()
  }, [invalidateCache, refetch])

  useEffect(() => {
    refetch()
  }, [refetch])

  const ingredientMap = useMemo(() => {
    const m = new Map()
    ingredients.forEach((ing) => m.set(ing.id, ing))
    return m
  }, [ingredients])

  const handleDeleteIngredient = useCallback(
    async (riId) => {
      if (!window.confirm('Remove this ingredient from the recipe?')) return
      try {
        await fetchApi(`/api/recipe-ingredients/${riId}`, { method: 'DELETE' })
        invalidateCache('/api/recipe-ingredients')
        refetch(true)
      } catch (e) {
        console.error(e)
      }
    },
    [fetchApi, invalidateCache, refetch]
  )

  const handleIngredientSaved = useCallback(() => {
    invalidateCache('/api/recipe-ingredients')
    refetch(true)
    setEditIngredient(null)
  }, [invalidateCache, refetch])

  const handleRecipeUpdate = useCallback(
    async (fields) => {
      if (!recipe) return
      try {
        await fetchApi(`/api/recipes/${recipe.id}`, {
          method: 'PATCH',
          body: JSON.stringify(fields),
        })
        setRecipe((prev) => (prev ? { ...prev, ...fields } : null))
        invalidateCache('/api/recipes')
        setEditingField(null)
      } catch (e) {
        console.error(e)
      }
      refetch(true)
    },
    [fetchApi, recipe, invalidateCache, refetch]
  )

  const handleDeleteRecipe = useCallback(async () => {
    if (!recipe || !window.confirm('Delete this recipe? This cannot be undone.')) return
    try {
      await fetchApi(`/api/recipes/${recipe.id}`, { method: 'DELETE' })
      invalidateCache('/api/recipes')
      navigate('/recipes')
    } catch (e) {
      console.error(e)
    }
  }, [fetchApi, recipe, invalidateCache, navigate])

  if (loading && !recipe) {
    return (
      <div className="app-content flex justify-center items-center min-h-[200px]">
        <Spinner />
      </div>
    )
  }

  if (error || !recipe) {
    return (
      <div className="app-content">
        <PageHeader
          title="Recipe"
          breadcrumbs={[{ label: 'Recipes', to: '/recipes' }, { label: 'Detail', to: '#' }]}
          onRefresh={handleRefresh}
        />
        <p className="text-red-600 dark:text-red-400 py-4">{error || 'Recipe not found.'}</p>
        <Link to="/recipes" className="text-primary hover:underline">Back to Recipes</Link>
      </div>
    )
  }

  const recipeName = str(field(recipe, 'Name ES')) || str(field(recipe, 'Name')) || '(untitled)'
  const name = str(field(recipe, 'Name')) || ''
  const nameES = str(field(recipe, 'Name ES')) || ''
  const description = str(field(recipe, 'Description')) || ''
  const mealTypes = arr(field(recipe, 'Meal Type'))
  const mealTypesDisplay = mealTypes.length ? mealTypes.join(', ') : ''
  const cuisineType = str(field(recipe, 'Cuisine Type')) || ''
  const timeMins = num(field(recipe, 'Time to Cook (minutes)'))
  const servings = num(field(recipe, 'Servings'))
  const cookingProcess = str(field(recipe, 'Cooking Process')) || ''
  const sourceUrl = str(field(recipe, 'Source/URL')) || ''
  const tags = str(field(recipe, 'Tags')) || ''
  const complexityRating = num(field(recipe, 'Complexity Rating'))
  const nutrientRating = num(field(recipe, 'Nutrient Rating'))

  const startEdit = (fieldName, currentValue) => {
    setEditingField(fieldName)
    setEditValue(currentValue ?? '')
  }

  return (
    <div className="app-content">
      <PageHeader
        title={recipeName}
        breadcrumbs={[
          { label: 'Recipes', to: '/recipes' },
          { label: recipeName, to: `/recipes/${id}` },
        ]}
        onRefresh={handleRefresh}
        loading={loading}
      />

      <div className="space-y-6">
        {/* Recipe card: editable title + parameters (like ObjectiveDetail) */}
        <div className="rounded-2xl border border-2 border-border bg-surface overflow-hidden">
          <div className="p-5 border-b border-border flex items-center justify-between gap-3">
            {editingField === 'name' ? (
              <input
                type="text"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={async () => {
                  if (editingField !== 'name') return
                  await handleRecipeUpdate({ Name: editValue.trim() || '(untitled)' })
                  setEditingField(null)
                }}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); e.target.blur() } }}
                className="flex-1 min-w-0 font-bold text-xl text-text bg-surface border border-border rounded-lg px-2 py-1"
                autoFocus
              />
            ) : (
              <h1
                role="button"
                tabIndex={0}
                onClick={() => startEdit('name', name || '(untitled)')}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); startEdit('name', name || '(untitled)') } }}
                className="font-bold text-xl text-text truncate flex-1 min-w-0 cursor-pointer rounded hover:bg-border/50 py-1 -mx-1 px-1 flex items-center gap-2"
              >
                <span className="shrink-0 text-text-muted"><IconBook size={22} /></span>
                {recipeName || '(untitled)'}
              </h1>
            )}
            <button
              type="button"
              onClick={handleDeleteRecipe}
              title="Delete recipe"
              className="shrink-0 p-2 rounded-xl text-text-muted hover:bg-red-500/20 hover:text-red-600 dark:hover:text-red-400 transition-colors"
              aria-label="Delete recipe"
            >
              <IconTrash size={20} />
            </button>
          </div>

          <div className="p-5 space-y-4">
            {/* Name ES */}
            <div className="flex items-center gap-2 text-sm">
              <span className="text-text-muted shrink-0 w-24">Name (ES):</span>
              {editingField === 'nameES' ? (
                <input
                  type="text"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onBlur={async () => { await handleRecipeUpdate({ 'Name ES': editValue.trim() || undefined }); setEditingField(null) }}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); e.target.blur() } }}
                  className="flex-1 min-w-0 rounded-lg border border-border bg-surface text-text px-2 py-1"
                  autoFocus
                />
              ) : (
                <span
                  role="button"
                  tabIndex={0}
                  onClick={() => startEdit('nameES', nameES)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); startEdit('nameES', nameES) } }}
                  className="text-text cursor-pointer rounded hover:bg-border/50 py-0.5 px-1 flex-1 min-w-0"
                >
                  {nameES || '—'}
                </span>
              )}
            </div>

            {/* Meal Type (multi-select) */}
            <div className="flex items-start gap-2 text-sm">
              <span className="text-text-muted shrink-0 w-24">Meal type:</span>
              {editingField === 'mealType' ? (
                <div className="flex flex-wrap gap-2">
                  {MEAL_TYPE_OPTIONS.map((opt) => (
                    <label key={opt} className="inline-flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={mealTypes.includes(opt)}
                        onChange={() => {
                          const next = mealTypes.includes(opt)
                            ? mealTypes.filter((t) => t !== opt)
                            : [...mealTypes, opt]
                          handleRecipeUpdate({ 'Meal Type': next })
                        }}
                        className="rounded border-border text-primary focus:ring-primary"
                      />
                      <span className="text-text">{opt}</span>
                    </label>
                  ))}
                  <button
                    type="button"
                    onClick={() => setEditingField(null)}
                    className="text-sm text-text-muted hover:underline"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <span
                  role="button"
                  tabIndex={0}
                  onClick={() => startEdit('mealType', mealTypesDisplay)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); startEdit('mealType', mealTypesDisplay) } }}
                  className="text-text cursor-pointer rounded hover:bg-border/50 py-0.5 px-1 flex-1 min-w-0"
                >
                  {mealTypesDisplay || '—'}
                </span>
              )}
            </div>

            {/* Cuisine Type */}
            <div className="flex items-center gap-2 text-sm">
              <span className="text-text-muted shrink-0 w-24">Cuisine:</span>
              {editingField === 'cuisineType' ? (
                <select
                  value={editValue}
                  onChange={(e) => { const v = e.target.value; handleRecipeUpdate({ 'Cuisine Type': v || undefined }); setEditValue(v); setEditingField(null) }}
                  onBlur={() => setEditingField(null)}
                  className="flex-1 min-w-0 rounded-lg border border-border bg-surface text-text px-2 py-1"
                  autoFocus
                >
                  <option value="">—</option>
                  {CUISINE_TYPE_OPTIONS.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              ) : (
                <span
                  role="button"
                  tabIndex={0}
                  onClick={() => startEdit('cuisineType', cuisineType)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); startEdit('cuisineType', cuisineType) } }}
                  className="text-text cursor-pointer rounded hover:bg-border/50 py-0.5 px-1"
                >
                  {cuisineType || '—'}
                </span>
              )}
            </div>

            {/* Time to Cook & Servings */}
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-text-muted shrink-0">Time (min):</span>
                {editingField === 'timeToCook' ? (
                  <input
                    type="number"
                    min="0"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={async () => {
                      const v = editValue === '' ? undefined : Number(editValue)
                      await handleRecipeUpdate({ 'Time to Cook (minutes)': v })
                      setEditingField(null)
                    }}
                    onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur() }}
                    className="w-20 rounded-lg border border-border bg-surface text-text px-2 py-1"
                    autoFocus
                  />
                ) : (
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={() => startEdit('timeToCook', timeMins != null ? String(timeMins) : '')}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); startEdit('timeToCook', timeMins != null ? String(timeMins) : '') } }}
                    className="text-text cursor-pointer rounded hover:bg-border/50 py-0.5 px-1"
                  >
                    {timeMins != null ? timeMins : '—'}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-text-muted shrink-0">Servings:</span>
                {editingField === 'servings' ? (
                  <input
                    type="number"
                    min="0"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={async () => {
                      const v = editValue === '' ? undefined : Number(editValue)
                      await handleRecipeUpdate({ Servings: v })
                      setEditingField(null)
                    }}
                    onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur() }}
                    className="w-20 rounded-lg border border-border bg-surface text-text px-2 py-1"
                    autoFocus
                  />
                ) : (
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={() => startEdit('servings', servings != null ? String(servings) : '')}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); startEdit('servings', servings != null ? String(servings) : '') } }}
                    className="text-text cursor-pointer rounded hover:bg-border/50 py-0.5 px-1"
                  >
                    {servings != null ? servings : '—'}
                  </span>
                )}
              </div>
            </div>

            {/* Complexity & Nutrient rating */}
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-text-muted shrink-0">Complexity (1–5):</span>
                {editingField === 'complexityRating' ? (
                  <input
                    type="number"
                    min="1"
                    max="5"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={async () => {
                      const v = editValue === '' ? undefined : Number(editValue)
                      await handleRecipeUpdate({ 'Complexity Rating': v })
                      setEditingField(null)
                    }}
                    onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur() }}
                    className="w-14 rounded-lg border border-border bg-surface text-text px-2 py-1"
                    autoFocus
                  />
                ) : (
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={() => startEdit('complexityRating', complexityRating != null ? String(complexityRating) : '')}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); startEdit('complexityRating', complexityRating != null ? String(complexityRating) : '') } }}
                    className="text-text cursor-pointer rounded hover:bg-border/50 py-0.5 px-1"
                  >
                    {complexityRating != null ? complexityRating : '—'}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-text-muted shrink-0">Nutrient (1–5):</span>
                {editingField === 'nutrientRating' ? (
                  <input
                    type="number"
                    min="1"
                    max="5"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={async () => {
                      const v = editValue === '' ? undefined : Number(editValue)
                      await handleRecipeUpdate({ 'Nutrient Rating': v })
                      setEditingField(null)
                    }}
                    onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur() }}
                    className="w-14 rounded-lg border border-border bg-surface text-text px-2 py-1"
                    autoFocus
                  />
                ) : (
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={() => startEdit('nutrientRating', nutrientRating != null ? String(nutrientRating) : '')}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); startEdit('nutrientRating', nutrientRating != null ? String(nutrientRating) : '') } }}
                    className="text-text cursor-pointer rounded hover:bg-border/50 py-0.5 px-1"
                  >
                    {nutrientRating != null ? nutrientRating : '—'}
                  </span>
                )}
              </div>
            </div>

            <hr className="border-border" />

            {/* Description */}
            <div className="text-sm">
              <span className="text-text-muted block mb-1">Description</span>
              {editingField === 'description' ? (
                <textarea
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onBlur={async () => { await handleRecipeUpdate({ Description: editValue }); setEditingField(null) }}
                  className="w-full rounded-lg border border-border bg-surface text-text px-3 py-2 min-h-[80px] resize-y"
                  autoFocus
                />
              ) : (
                <p
                  role="button"
                  tabIndex={0}
                  onClick={() => startEdit('description', description)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); startEdit('description', description) } }}
                  className="text-text whitespace-pre-wrap cursor-pointer rounded hover:bg-border/50 py-2 px-2 min-h-[2rem]"
                >
                  {description || '(no description)'}
                </p>
              )}
            </div>

            {/* Cooking process */}
            <div className="text-sm">
              <span className="text-text-muted block mb-1">Cooking process</span>
              {editingField === 'cookingProcess' ? (
                <textarea
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onBlur={async () => { await handleRecipeUpdate({ 'Cooking Process': editValue }); setEditingField(null) }}
                  className="w-full rounded-lg border border-border bg-surface text-text px-3 py-2 min-h-[80px] resize-y"
                  autoFocus
                />
              ) : (
                <p
                  role="button"
                  tabIndex={0}
                  onClick={() => startEdit('cookingProcess', cookingProcess)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); startEdit('cookingProcess', cookingProcess) } }}
                  className="text-text whitespace-pre-wrap cursor-pointer rounded hover:bg-border/50 py-2 px-2 min-h-[2rem]"
                >
                  {cookingProcess || '(none)'}
                </p>
              )}
            </div>

            {/* Source/URL */}
            <div className="flex items-center gap-2 text-sm">
              <span className="text-text-muted shrink-0 w-24">Source / URL:</span>
              {editingField === 'sourceUrl' ? (
                <input
                  type="url"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onBlur={async () => { await handleRecipeUpdate({ 'Source/URL': editValue.trim() || undefined }); setEditingField(null) }}
                  onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur() }}
                  className="flex-1 min-w-0 rounded-lg border border-border bg-surface text-text px-2 py-1"
                  autoFocus
                />
              ) : (
                <span
                  role="button"
                  tabIndex={0}
                  onClick={() => startEdit('sourceUrl', sourceUrl)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); startEdit('sourceUrl', sourceUrl) } }}
                  className="text-text cursor-pointer rounded hover:bg-border/50 py-0.5 px-1 flex-1 min-w-0 truncate block"
                >
                  {sourceUrl ? (
                    <a href={sourceUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline" onClick={(e) => e.stopPropagation()}>
                      {sourceUrl}
                    </a>
                  ) : (
                    '—'
                  )}
                </span>
              )}
            </div>

            {/* Tags */}
            <div className="flex items-start gap-2 text-sm">
              <span className="text-text-muted shrink-0 w-24">Tags:</span>
              {editingField === 'tags' ? (
                <input
                  type="text"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onBlur={async () => { await handleRecipeUpdate({ Tags: editValue.trim() || undefined }); setEditingField(null) }}
                  onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur() }}
                  className="flex-1 min-w-0 rounded-lg border border-border bg-surface text-text px-2 py-1"
                  autoFocus
                />
              ) : (
                <span
                  role="button"
                  tabIndex={0}
                  onClick={() => startEdit('tags', tags)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); startEdit('tags', tags) } }}
                  className="text-text cursor-pointer rounded hover:bg-border/50 py-0.5 px-1 flex-1 min-w-0"
                >
                  {tags || '—'}
                </span>
              )}
            </div>
          </div>
        </div>

        <section aria-labelledby="ingredients-heading">
          <div className="flex items-center justify-between gap-3 mb-3">
            <h2 id="ingredients-heading" className="font-semibold text-lg text-text">
              Ingredients
            </h2>
            <button
              type="button"
              onClick={() => setAddIngredientOpen(true)}
              className="min-h-[40px] px-4 rounded-xl text-sm font-medium bg-primary text-white hover:bg-primary/90"
            >
              Add ingredient
            </button>
          </div>
          <div className="grid gap-3">
            {recipeIngredients.length === 0 ? (
              <p className="text-text-muted text-sm py-4">No ingredients yet. Add one to refine your recipe.</p>
            ) : (
              recipeIngredients.map((ri) => (
                <RecipeIngredientRow
                  key={ri.id}
                  recipeIngredient={ri}
                  ingredientMap={ingredientMap}
                  onDelete={handleDeleteIngredient}
                  onEdit={setEditIngredient}
                />
              ))
            )}
          </div>
        </section>
      </div>

      {addIngredientOpen && (
        <RecipeIngredientModal
          recipeId={id}
          ingredients={ingredients}
          onClose={() => setAddIngredientOpen(false)}
          onSaved={handleIngredientSaved}
        />
      )}
      {editIngredient && (
        <RecipeIngredientModal
          recipeId={id}
          recipeIngredient={editIngredient}
          ingredients={ingredients}
          onClose={() => setEditIngredient(null)}
          onSaved={handleIngredientSaved}
          onDeleted={handleIngredientSaved}
        />
      )}
      <Fab onClick={() => setAddIngredientOpen(true)} ariaLabel="Add ingredient" />
    </div>
  )
}
