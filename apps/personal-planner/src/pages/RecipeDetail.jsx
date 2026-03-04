import { useState, useEffect, useCallback, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  Spinner,
  PageHeader,
  Card,
  IconBook,
  IconChevronDown,
  IconChevronUp,
  IconTrash,
  field,
  str,
  num,
  arr,
} from '@tools/shared'
import { usePlannerApi } from '../contexts/PlannerApiContext'
import { RecipeIngredientModal } from '../components/RecipeIngredientModal'

function RecipeIngredientRow({ recipeIngredient, ingredientMap, onDelete, onEdit, onExpand, isExpanded }) {
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
          {hasDetails && (
            <button
              type="button"
              onClick={onExpand}
              className="p-2 rounded-lg text-text-muted hover:bg-border hover:text-text"
              aria-expanded={isExpanded}
              aria-label={isExpanded ? 'Collapse' : 'Expand'}
            >
              {isExpanded ? <IconChevronUp size={18} /> : <IconChevronDown size={18} />}
            </button>
          )}
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
      {hasDetails && isExpanded && (
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
  const [expandedId, setExpandedId] = useState(null)
  const [addIngredientOpen, setAddIngredientOpen] = useState(false)
  const [editIngredient, setEditIngredient] = useState(null)

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
  const description = str(field(recipe, 'Description'))
  const mealType = str(field(recipe, 'Meal Type'))
  const cuisineType = str(field(recipe, 'Cuisine Type'))
  const timeMins = num(field(recipe, 'Time to Cook (minutes)'))
  const servings = num(field(recipe, 'Servings'))
  const cookingProcess = str(field(recipe, 'Cooking Process'))
  const sourceUrl = str(field(recipe, 'Source/URL'))
  const tags = str(field(recipe, 'Tags'))

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
        <Card title="" icon={<IconBook size={20} />}>
          <div className="space-y-2 text-sm text-text-muted">
            {(mealType || cuisineType) && (
              <div className="flex flex-wrap gap-2">
                {mealType && <span className="px-2 py-0.5 rounded-lg bg-border">{mealType}</span>}
                {cuisineType && <span className="px-2 py-0.5 rounded-lg bg-border">{cuisineType}</span>}
              </div>
            )}
            {(timeMins != null || servings != null) && (
              <div>
                {timeMins != null && <span>{timeMins} min</span>}
                {timeMins != null && servings != null && ' · '}
                {servings != null && <span>{servings} servings</span>}
              </div>
            )}
            {description && <p className="text-text">{description}</p>}
            {cookingProcess && (
              <div className="pt-2 border-t border-border">
                <span className="font-medium text-text">Cooking process</span>
                <p className="mt-1 whitespace-pre-wrap">{cookingProcess}</p>
              </div>
            )}
            {sourceUrl && (
              <a href={sourceUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                Source / URL
              </a>
            )}
            {tags && <p><span className="font-medium text-text">Tags:</span> {tags}</p>}
          </div>
        </Card>

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
                  onExpand={() => setExpandedId((prev) => (prev === ri.id ? null : ri.id))}
                  isExpanded={expandedId === ri.id}
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
        />
      )}
    </div>
  )
}
