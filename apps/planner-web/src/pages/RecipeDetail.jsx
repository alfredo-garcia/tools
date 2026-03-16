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

export function RecipeDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { graphql } = usePlannerApi()
  const [recipe, setRecipe] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    if (!id) return
    setLoading(true)
    setError(null)
    try {
      const data = await graphql(RECIPE_QUERY, { id })
      setRecipe(data?.recipe ?? null)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [graphql, id])

  useEffect(() => {
    load()
  }, [load])

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
      <EntityDetailPage header={<PageHeader title="Recipe" onBack={() => navigate('/recipes')} />}>
        <p className="text-text-muted">{error || 'Recipe not found.'}</p>
      </EntityDetailPage>
    )
  }

  const title = [recipe.nameES, recipe.name].filter(Boolean).join(' — ') || recipe.name || 'Recipe'
  const mealTypes = Array.isArray(recipe.mealType) ? recipe.mealType : []

  return (
    <EntityDetailPage header={<PageHeader title={title} onBack={() => navigate('/recipes')} />}>
      {error && (
        <p className="text-red-600 dark:text-red-400 text-sm mb-4" role="alert">
          {error}
        </p>
      )}
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
    </EntityDetailPage>
  )
}
