import { useState, useEffect, useCallback, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Spinner,
  PageHeader,
  Card,
  IconBook,
  IconCoffee,
  IconChickenLeg,
  IconEggFried,
  IconCakeSlice,
  IconCake,
  IconBottle,
  IconCookie,
  IconMartini,
  IconSearch,
  Fab,
  FilterBar,
  FilterDropdown,
} from '@tools/shared'
import { usePlannerApi } from '../contexts/PlannerApiContext'
import { field, str, num, arr } from '@tools/shared'
import { recipeMatchesMealTypes, MEAL_TYPE_OPTIONS, getDominantMealType, getMealTypeIconKey } from '../lib/mealsUtils'
import { RecipeCreateModal } from '../components/RecipeCreateModal'

const MEAL_TYPE_LABELS = {
  Breakfast: 'Breakfast',
  Lunch: 'Lunch',
  Dinner: 'Dinner',
  Sauce: 'Sauce',
  Dessert: 'Dessert',
  Snack: 'Snack',
  Tapa: 'Tapa',
}
const MEAL_TYPE_OPTIONS_WITH_LABELS = MEAL_TYPE_OPTIONS.map((value) => ({
  value,
  label: MEAL_TYPE_LABELS[value] || value,
}))

const ICON_BY_KEY = {
  Coffee: IconCoffee,
  ChickenLeg: IconChickenLeg,
  EggFried: IconEggFried,
  Cake: IconCake,
  CakeSlice: IconCakeSlice,
  Bottle: IconBottle,
  Cookie: IconCookie,
  Martini: IconMartini,
  Book: IconBook,
}

function RecipeCard({ recipe }) {
  const name = str(field(recipe, 'Name')) || str(field(recipe, 'Name ES')) || '(untitled)'
  const nameES = str(field(recipe, 'Name ES'))
  const title = nameES && name !== nameES ? `${nameES} — ${name}` : name
  const mealTypes = arr(field(recipe, 'Meal Type'))
  const dominantMealType = getDominantMealType(recipe)
  const iconKey = getMealTypeIconKey(dominantMealType)
  const Icon = ICON_BY_KEY[iconKey] || IconBook
  const cuisineType = str(field(recipe, 'Cuisine Type'))
  const timeMins = num(field(recipe, 'Time to Cook (minutes)'))
  const servings = num(field(recipe, 'Servings'))

  return (
    <Link to={`/recipes/${recipe.id}`} className="block">
      <Card title={title} icon={<Icon size={20} />} className="hover:ring-2 hover:ring-primary/30 transition-shadow">
        <div className="flex flex-wrap items-center gap-2 text-sm text-text-muted">
          {mealTypes.map((mt) => (
            <span key={mt} className="inline-flex px-2 py-0.5 rounded-lg bg-border text-text-muted font-medium">
              {MEAL_TYPE_LABELS[mt] || mt}
            </span>
          ))}
          {cuisineType && (
            <span className="inline-flex px-2 py-0.5 rounded-lg bg-border text-text-muted">
              {cuisineType}
            </span>
          )}
          {timeMins != null && (
            <span>{timeMins} min</span>
          )}
          {servings != null && (
            <span>{servings} servings</span>
          )}
        </div>
      </Card>
    </Link>
  )
}

export function RecipesList() {
  const navigate = useNavigate()
  const { fetchApi, invalidateCache } = usePlannerApi()
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [mealTypeFilter, setMealTypeFilter] = useState([])
  const [createRecipeOpen, setCreateRecipeOpen] = useState(false)

  const refetch = useCallback(() => {
    setLoading(true)
    setError(null)
    return fetchApi('/api/recipes')
      .then((r) => {
        setList(r.data || [])
        return r
      })
      .catch((e) => {
        setError(e.message)
        throw e
      })
      .finally(() => setLoading(false))
  }, [fetchApi])

  const handleRefresh = useCallback(() => {
    invalidateCache('/api/recipes')
    refetch()
  }, [invalidateCache, refetch])

  useEffect(() => {
    refetch()
  }, [refetch])

  const filtered = useMemo(() => {
    let result = list.filter((r) => recipeMatchesMealTypes(r, mealTypeFilter))
    const q = search.trim().toLowerCase()
    if (!q) return result
    return result.filter((r) => {
      const name = (str(field(r, 'Name')) + ' ' + str(field(r, 'Name ES'))).toLowerCase()
      const desc = (str(field(r, 'Description')) || '').toLowerCase()
      const tags = (str(field(r, 'Tags')) || '').toLowerCase()
      const meal = (str(field(r, 'Meal Type')) || '').toLowerCase()
      const cuisine = (str(field(r, 'Cuisine Type')) || '').toLowerCase()
      return name.includes(q) || desc.includes(q) || tags.includes(q) || meal.includes(q) || cuisine.includes(q)
    })
  }, [list, search, mealTypeFilter])

  const handleRecipeCreated = useCallback(
    (recipe) => {
      invalidateCache('/api/recipes')
      setCreateRecipeOpen(false)
      if (recipe?.id) navigate(`/recipes/${recipe.id}`)
    },
    [invalidateCache, navigate]
  )

  return (
    <div className="app-content">
      <PageHeader
        title="Recipes"
        breadcrumbs={[{ label: 'Recipes', to: '/recipes' }]}
        onRefresh={handleRefresh}
        loading={loading}
      />
      <div className="space-y-4">
        <FilterBar>
          <FilterDropdown
            label="Meal type"
            summary={mealTypeFilter.length === 0 ? 'All meal types' : mealTypeFilter.length === 1 ? (MEAL_TYPE_LABELS[mealTypeFilter[0]] || mealTypeFilter[0]) : `${mealTypeFilter.length} selected`}
            options={MEAL_TYPE_OPTIONS_WITH_LABELS}
            value={mealTypeFilter}
            onChange={setMealTypeFilter}
            multi
            allOptionLabel="All meal types"
          />
        </FilterBar>
        <div className="relative">
          <IconSearch
            size={20}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
          />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search recipes…"
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-surface text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary"
            aria-label="Search recipes"
          />
        </div>

        {loading && (
          <div className="flex justify-center py-8">
            <Spinner />
          </div>
        )}
        {error && (
          <p className="text-red-600 dark:text-red-400 text-sm py-4">{error}</p>
        )}
        {!loading && !error && (
          <div className="grid gap-3">
            {filtered.length === 0 ? (
              <p className="text-text-muted text-sm py-6 text-center">
                No recipes match your search.
              </p>
            ) : (
              filtered.map((recipe) => (
                <RecipeCard key={recipe.id} recipe={recipe} />
              ))
            )}
          </div>
        )}
      </div>

      {createRecipeOpen && (
        <RecipeCreateModal
          onClose={() => setCreateRecipeOpen(false)}
          onCreate={handleRecipeCreated}
        />
      )}
      <Fab onClick={() => setCreateRecipeOpen(true)} ariaLabel="Create recipe" />
    </div>
  )
}
