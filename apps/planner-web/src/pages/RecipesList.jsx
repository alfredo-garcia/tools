import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Spinner,
  PageHeader,
  Card,
  CardList,
  EntityListPage,
  IconSearch,
  FilterBar,
  FilterDropdown,
} from '@tools/shared'
import { usePlannerApi } from '../contexts/PlannerApiContext'
import { getRecipeMealTypeIcon } from '../lib/recipeMealTypeIcon'

const RECIPES_QUERY = `
  query { recipes { id name nameES description mealType cuisineType timeToCookMinutes servings complexityRating tags lastModified } }
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

const COMPLEXITY_OPTIONS = [
  { value: '', label: 'Any' },
  { value: '1', label: '1' },
  { value: '2', label: '2' },
  { value: '3', label: '3' },
  { value: '4', label: '4' },
  { value: '5', label: '5' },
]

function RecipeCard({ recipe, onClick }) {
  const title = [recipe.nameES, recipe.name].filter(Boolean).join(' — ') || recipe.name || '(untitled)'
  const mealTypes = Array.isArray(recipe.mealType) ? recipe.mealType : []
  const Icon = getRecipeMealTypeIcon(recipe)

  return (
    <Card
      title={title}
      icon={<Icon size={20} />}
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
  const [complexityFilter, setComplexityFilter] = useState('')
  const [search, setSearch] = useState('')

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

  const filtered = useMemo(() => {
    let result = list
    if (mealTypeFilter.length > 0) {
      result = result.filter((r) => {
        const types = Array.isArray(r.mealType) ? r.mealType : []
        return mealTypeFilter.some((f) => types.includes(f))
      })
    }
    if (complexityFilter !== '') {
      const level = parseFloat(complexityFilter)
      result = result.filter((r) => r.complexityRating != null && Math.round(r.complexityRating) === level)
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      result = result.filter(
        (r) =>
          (r.name || '').toLowerCase().includes(q) ||
          (r.nameES || '').toLowerCase().includes(q) ||
          (r.description || '').toLowerCase().includes(q) ||
          (r.tags || '').toLowerCase().includes(q) ||
          (Array.isArray(r.mealType) ? r.mealType.join(' ').toLowerCase() : '').includes(q) ||
          (r.cuisineType || '').toLowerCase().includes(q)
      )
    }
    return result
  }, [list, mealTypeFilter, complexityFilter, search])

  const mealTypeSummary =
    mealTypeFilter.length === 0 ? 'All types' : mealTypeFilter.slice(0, 2).join(', ') + (mealTypeFilter.length > 2 ? '…' : '')

  return (
    <EntityListPage
      header={<PageHeader title="Recipes" onRefresh={load} loading={loading} />}
      filters={
        <div className="space-y-3">
          <div className="relative w-full max-w-md">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none">
              <IconSearch size={18} />
            </span>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search recipes…"
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-surface text-text text-sm"
              aria-label="Search recipes"
            />
          </div>
          <FilterBar>
            <FilterDropdown
              label="Meal type"
              summary={mealTypeSummary}
              options={MEAL_TYPE_OPTIONS}
              value={mealTypeFilter}
              onChange={setMealTypeFilter}
              multi
            />
            <FilterDropdown
              label="Complexity"
              summary={complexityFilter === '' ? 'Any' : complexityFilter}
              options={COMPLEXITY_OPTIONS}
              value={complexityFilter}
              onChange={setComplexityFilter}
            />
          </FilterBar>
        </div>
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
