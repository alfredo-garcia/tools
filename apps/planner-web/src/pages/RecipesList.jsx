import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Spinner,
  PageHeader,
  Card,
  CardList,
  EntityListPage,
  IconBook,
  FilterBar,
  FilterDropdown,
} from '@tools/shared'
import { usePlannerApi } from '../contexts/PlannerApiContext'

const RECIPES_QUERY = `
  query { recipes { id name nameES description mealType cuisineType timeToCookMinutes servings lastModified } }
`

const MEAL_TYPE_OPTIONS = [
  { value: 'Breakfast', label: 'Breakfast' },
  { value: 'Lunch', label: 'Lunch' },
  { value: 'Dinner', label: 'Dinner' },
  { value: 'Sauce', label: 'Sauce' },
  { value: 'Dessert', label: 'Dessert' },
  { value: 'Snack', label: 'Snack' },
  { value: 'Tapa', label: 'Tapa' },
]

function RecipeCard({ recipe, onClick }) {
  const title = [recipe.nameES, recipe.name].filter(Boolean).join(' — ') || recipe.name || '(untitled)'
  const mealTypes = Array.isArray(recipe.mealType) ? recipe.mealType : []

  return (
    <Card
      title={title}
      icon={<IconBook size={20} />}
      className="cursor-pointer hover:ring-2 hover:ring-primary/30 transition-shadow"
      onClick={onClick}
    >
      <div className="flex flex-wrap items-center gap-2 text-sm text-text-muted">
        {mealTypes.slice(0, 3).map((mt) => (
          <span key={mt} className="px-2 py-0.5 rounded-lg bg-border font-medium">
            {mt}
          </span>
        ))}
        {recipe.cuisineType && (
          <span className="px-2 py-0.5 rounded-lg bg-border">{recipe.cuisineType}</span>
        )}
        {recipe.timeToCookMinutes != null && <span>{recipe.timeToCookMinutes} min</span>}
        {recipe.servings != null && <span>{recipe.servings} servings</span>}
      </div>
    </Card>
  )
}

export function RecipesList() {
  const navigate = useNavigate()
  const { graphql } = usePlannerApi()
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [mealTypeFilter, setMealTypeFilter] = useState([])

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await graphql(RECIPES_QUERY)
      setList(data?.recipes ?? [])
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [graphql])

  useEffect(() => {
    load()
  }, [load])

  const filtered =
    mealTypeFilter.length === 0
      ? list
      : list.filter((r) => {
          const types = Array.isArray(r.mealType) ? r.mealType : []
          return mealTypeFilter.some((f) => types.includes(f))
        })

  const mealTypeSummary =
    mealTypeFilter.length === 0 ? 'All types' : mealTypeFilter.slice(0, 2).join(', ') + (mealTypeFilter.length > 2 ? '…' : '')

  return (
    <EntityListPage
      header={<PageHeader title="Recipes" onRefresh={load} loading={loading} />}
      filters={
        <FilterBar>
          <FilterDropdown
            label="Meal type"
            summary={mealTypeSummary}
            options={MEAL_TYPE_OPTIONS}
            value={mealTypeFilter}
            onChange={setMealTypeFilter}
            multi
          />
        </FilterBar>
      }
      showEmptyState={!loading && filtered.length === 0}
      emptyState={
        <p className="text-text-muted text-center py-8">
          {list.length === 0 ? 'No recipes yet.' : 'No recipes match the filter.'}
        </p>
      }
    >
      {error && (
        <p className="text-red-600 dark:text-red-400 text-sm mb-4" role="alert">
          {error}
        </p>
      )}
      {loading && list.length === 0 ? (
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      ) : (
        <CardList>
          {filtered.map((recipe) => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              onClick={() => navigate(`/recipes/${recipe.id}`)}
            />
          ))}
        </CardList>
      )}
    </EntityListPage>
  )
}
