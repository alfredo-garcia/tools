import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Spinner, PageHeader, EntityDetailPage } from '@tools/shared'
import { usePlannerApi } from '../contexts/PlannerApiContext'

const RECIPE_QUERY = `
  query Recipe($id: ID!) {
    recipe(id: $id) {
      id name nameES description mealType cookingProcess complexityRating nutrientRating
      timeToCookMinutes servings cuisineType sourceUrl tags lastModified
    }
  }
`

const UPDATE_RECIPE = `
  mutation UpdateRecipe($id: ID!, $input: RecipeUpdateInput!) {
    updateRecipe(id: $id, input: $input) { id name nameES }
  }
`

const MEAL_TYPE_OPTIONS = ['Breakfast', 'Lunch', 'Dinner', 'Sauce', 'Dessert', 'Snack', 'Tapa']

export function RecipeDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { graphql } = usePlannerApi()
  const [recipe, setRecipe] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState({})

  const load = useCallback(async () => {
    if (!id) return
    setLoading(true)
    setError(null)
    try {
      const data = await graphql(RECIPE_QUERY, { id })
      const r = data?.recipe ?? null
      setRecipe(r)
      if (r) {
        setEditForm({
          name: r.name || '',
          nameES: r.nameES || '',
          description: r.description || '',
          mealType: Array.isArray(r.mealType) ? r.mealType : [],
          cookingProcess: r.cookingProcess || '',
          complexityRating: r.complexityRating != null ? r.complexityRating : '',
          nutrientRating: r.nutrientRating != null ? r.nutrientRating : '',
          timeToCookMinutes: r.timeToCookMinutes != null ? r.timeToCookMinutes : '',
          servings: r.servings != null ? r.servings : '',
          cuisineType: r.cuisineType || '',
          sourceUrl: r.sourceUrl || '',
          tags: r.tags || '',
        })
      }
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [graphql, id])

  useEffect(() => {
    load()
  }, [load])

  const handleSave = useCallback(async () => {
    if (!recipe?.id) return
    try {
      await graphql(UPDATE_RECIPE, {
        id: recipe.id,
        input: {
          name: (editForm.name || '').trim() || undefined,
          nameES: (editForm.nameES || '').trim() || undefined,
          description: (editForm.description || '').trim() || undefined,
          mealType: Array.isArray(editForm.mealType) && editForm.mealType.length > 0 ? editForm.mealType : undefined,
          cookingProcess: (editForm.cookingProcess || '').trim() || undefined,
          complexityRating: editForm.complexityRating === '' ? undefined : parseFloat(editForm.complexityRating),
          nutrientRating: editForm.nutrientRating === '' ? undefined : parseFloat(editForm.nutrientRating),
          timeToCookMinutes: editForm.timeToCookMinutes === '' ? undefined : parseInt(editForm.timeToCookMinutes, 10),
          servings: editForm.servings === '' ? undefined : parseInt(editForm.servings, 10),
          cuisineType: (editForm.cuisineType || '').trim() || undefined,
          sourceUrl: (editForm.sourceUrl || '').trim() || undefined,
          tags: (editForm.tags || '').trim() || undefined,
        },
      })
      setEditing(false)
      load()
    } catch (err) {
      console.error(err)
    }
  }, [graphql, recipe?.id, editForm, load])

  if (loading && !recipe) {
    return (
      <div className="flex flex-col items-center gap-4 py-12">
        <Spinner />
        <p className="text-text-muted">Loading recipe…</p>
      </div>
    )
  }

  if (!recipe) {
    return (
      <EntityDetailPage header={<PageHeader breadcrumbs={[{ label: 'Recipes', to: '/recipes' }, { label: 'Recipe' }]} />}>
        <p className="text-text-muted">{error || 'Recipe not found.'}</p>
      </EntityDetailPage>
    )
  }

  const title = [recipe.nameES, recipe.name].filter(Boolean).join(' — ') || recipe.name || 'Recipe'
  const mealTypes = Array.isArray(recipe.mealType) ? recipe.mealType : []

  return (
    <EntityDetailPage
      header={
        <PageHeader
          title={title}
          breadcrumbs={[{ label: 'Recipes', to: '/recipes' }, { label: title }]}
          onRefresh={load}
          loading={loading}
        />
      }
    >
      {error && (
        <p className="text-red-600 dark:text-red-400 text-sm mb-4" role="alert">
          {error}
        </p>
      )}

      <div className="rounded-2xl border-2 border-border bg-surface p-5 space-y-4">
        {!editing ? (
          <>
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-bold text-xl text-text">{title}</h2>
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="px-3 py-1.5 rounded-lg border border-border text-text hover:bg-border text-sm"
              >
                Edit
              </button>
            </div>
            <dl className="space-y-2 text-sm">
              {mealTypes.length > 0 && (
                <>
                  <dt className="text-text-muted">Meal types</dt>
                  <dd>{mealTypes.join(', ')}</dd>
                </>
              )}
              {recipe.cuisineType && (
                <>
                  <dt className="text-text-muted">Cuisine</dt>
                  <dd>{recipe.cuisineType}</dd>
                </>
              )}
              {recipe.timeToCookMinutes != null && (
                <>
                  <dt className="text-text-muted">Time to cook</dt>
                  <dd>{recipe.timeToCookMinutes} min</dd>
                </>
              )}
              {recipe.servings != null && (
                <>
                  <dt className="text-text-muted">Servings</dt>
                  <dd>{recipe.servings}</dd>
                </>
              )}
              {recipe.description && (
                <>
                  <dt className="text-text-muted">Description</dt>
                  <dd className="whitespace-pre-wrap">{recipe.description}</dd>
                </>
              )}
              {recipe.cookingProcess && (
                <>
                  <dt className="text-text-muted">Cooking process</dt>
                  <dd className="whitespace-pre-wrap">{recipe.cookingProcess}</dd>
                </>
              )}
              {recipe.complexityRating != null && (
                <>
                  <dt className="text-text-muted">Complexity</dt>
                  <dd>{recipe.complexityRating}</dd>
                </>
              )}
              {recipe.sourceUrl && (
                <>
                  <dt className="text-text-muted">Source</dt>
                  <dd>
                    <a href={recipe.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                      {recipe.sourceUrl}
                    </a>
                  </dd>
                </>
              )}
            </dl>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-bold text-xl text-text">Edit recipe</h2>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="px-3 py-1.5 rounded-lg border border-border text-text hover:bg-border text-sm"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className="px-3 py-1.5 rounded-lg bg-primary text-white hover:bg-primary/90 text-sm"
                >
                  Save
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-muted mb-1">Name</label>
                <input
                  type="text"
                  value={editForm.name || ''}
                  onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))}
                  className="w-full rounded border border-border bg-surface text-text px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-muted mb-1">Name (ES)</label>
                <input
                  type="text"
                  value={editForm.nameES || ''}
                  onChange={(e) => setEditForm((p) => ({ ...p, nameES: e.target.value }))}
                  className="w-full rounded border border-border bg-surface text-text px-3 py-2"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-muted mb-1">Description</label>
              <textarea
                value={editForm.description || ''}
                onChange={(e) => setEditForm((p) => ({ ...p, description: e.target.value }))}
                className="w-full rounded border border-border bg-surface text-text px-3 py-2 min-h-[80px] resize-y"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-muted mb-1">Meal types (comma-separated)</label>
              <input
                type="text"
                value={Array.isArray(editForm.mealType) ? editForm.mealType.join(', ') : ''}
                onChange={(e) =>
                  setEditForm((p) => ({
                    ...p,
                    mealType: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                  }))
                }
                placeholder="Breakfast, Lunch, Dinner"
                className="w-full rounded border border-border bg-surface text-text px-3 py-2"
              />
            </div>
            <div className="flex flex-wrap gap-4">
              <div>
                <label className="block text-sm font-medium text-text-muted mb-1">Cuisine</label>
                <input
                  type="text"
                  value={editForm.cuisineType || ''}
                  onChange={(e) => setEditForm((p) => ({ ...p, cuisineType: e.target.value }))}
                  className="rounded border border-border bg-surface text-text px-2 py-1 text-sm w-40"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-muted mb-1">Time (min)</label>
                <input
                  type="number"
                  value={editForm.timeToCookMinutes === '' ? '' : editForm.timeToCookMinutes}
                  onChange={(e) => setEditForm((p) => ({ ...p, timeToCookMinutes: e.target.value }))}
                  className="rounded border border-border bg-surface text-text px-2 py-1 text-sm w-24"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-muted mb-1">Servings</label>
                <input
                  type="number"
                  value={editForm.servings === '' ? '' : editForm.servings}
                  onChange={(e) => setEditForm((p) => ({ ...p, servings: e.target.value }))}
                  className="rounded border border-border bg-surface text-text px-2 py-1 text-sm w-24"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-muted mb-1">Complexity (1-5)</label>
                <input
                  type="number"
                  min={1}
                  max={5}
                  value={editForm.complexityRating === '' ? '' : editForm.complexityRating}
                  onChange={(e) => setEditForm((p) => ({ ...p, complexityRating: e.target.value }))}
                  className="rounded border border-border bg-surface text-text px-2 py-1 text-sm w-20"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-muted mb-1">Cooking process</label>
              <textarea
                value={editForm.cookingProcess || ''}
                onChange={(e) => setEditForm((p) => ({ ...p, cookingProcess: e.target.value }))}
                className="w-full rounded border border-border bg-surface text-text px-3 py-2 min-h-[100px] resize-y"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-muted mb-1">Source URL</label>
              <input
                type="url"
                value={editForm.sourceUrl || ''}
                onChange={(e) => setEditForm((p) => ({ ...p, sourceUrl: e.target.value }))}
                className="w-full rounded border border-border bg-surface text-text px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-muted mb-1">Tags</label>
              <input
                type="text"
                value={editForm.tags || ''}
                onChange={(e) => setEditForm((p) => ({ ...p, tags: e.target.value }))}
                className="w-full rounded border border-border bg-surface text-text px-3 py-2"
              />
            </div>
          </>
        )}
      </div>

      <section className="pt-4">
        <h3 className="text-lg font-bold text-text mb-2">Ingredients</h3>
        <p className="text-sm text-text-muted">
          Ingredients are not available yet (API does not support recipe ingredients).
        </p>
      </section>
    </EntityDetailPage>
  )
}
