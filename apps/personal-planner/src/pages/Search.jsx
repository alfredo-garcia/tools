import { useState, useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Spinner, PageHeader, Card, IconSearch, IconX, IconTarget, IconCheckSquare, IconChevronDown, IconChevronUp, IconBook, IconCircle } from '@tools/shared'
import { usePlannerApi } from '../contexts/PlannerApiContext'
import { field, str, dateStr, arr, num } from '@tools/shared'
import { getTaskStatusGroup } from '../lib/taskStatus'
import { getPriorityTagClass } from '../components/TaskCard'
import { normalizeQuery, matchText, matchNameAndNameES } from '../lib/searchUtils'

const GROUP_LABELS = {
  objectives: 'Objectives',
  key_results: 'Key Results',
  tasks: 'Tasks',
  recipes: 'Recipes',
  ingredients: 'Ingredients',
}

function matchObjective(obj, query) {
  const name = str(field(obj, 'Objective Name', 'Objective Name'))
  const category = str(field(obj, 'Category', 'Category'))
  return matchText(name, query) || matchText(category, query)
}

function matchKeyResult(kr, query) {
  const name = str(field(kr, 'Key Result Name', 'Key Result Name'))
  const status = str(field(kr, 'Status', 'Status'))
  return matchText(name, query) || matchText(status, query)
}

function matchTask(task, query) {
  const name = str(field(task, 'Task Name', 'Task Name'))
  const description = str(field(task, 'Description', 'Description'))
  return matchText(name, query) || matchText(description, query)
}

function matchRecipe(recipe, query) {
  return (
    matchNameAndNameES(recipe, query) ||
    matchText(field(recipe, 'Description', 'Description'), query)
  )
}

function matchIngredient(ingredient, query) {
  return (
    matchNameAndNameES(ingredient, query) ||
    matchText(field(ingredient, 'Description', 'Description'), query)
  )
}

function SearchInput({ value, onChange, onSearch, onClear, showClear }) {
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') onSearch()
  }
  return (
    <div className="relative flex items-center">
      <span className="absolute left-3 pointer-events-none text-text-muted">
        <IconSearch size={20} />
      </span>
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Search objectives, key results, tasks, recipes, ingredients…"
        className="w-full pl-10 pr-10 py-3 rounded-xl border-2 border-border bg-surface text-text placeholder:text-text-muted focus:outline-none focus:border-primary [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden"
        aria-label="Search"
      />
      {showClear && (
        <button
          type="button"
          onClick={onClear}
          className="absolute right-2 p-1.5 rounded-lg text-text-muted hover:bg-surface-hover hover:text-text"
          aria-label="Clear search"
        >
          <IconX size={20} />
        </button>
      )}
    </div>
  )
}

function CollapsibleGroup({ label, count, children, initialCollapsed = false }) {
  const [collapsed, setCollapsed] = useState(initialCollapsed)
  if (count === 0) return null
  return (
    <section>
      <button
        type="button"
        onClick={() => setCollapsed((c) => !c)}
        className="flex items-center gap-2 w-full text-left py-1.5 font-medium text-text hover:text-primary transition-colors"
      >
        <span className="text-base">{label}</span>
        <span className="text-text-muted font-normal text-sm">{count}</span>
        <span className="ml-auto text-text-muted">
          {collapsed ? <IconChevronDown size={18} /> : <IconChevronUp size={18} />}
        </span>
      </button>
      {!collapsed && (
        <ul className="mt-2 space-y-2 list-none p-0 m-0">
          {children}
        </ul>
      )}
    </section>
  )
}

function ObjectiveCard({ objective, krStats }) {
  const name = str(field(objective, 'Objective Name', 'Objective Name')) || '(untitled)'
  const category = str(field(objective, 'Category', 'Category'))
  const priority = str(field(objective, 'Priority', 'Priority'))
  const targetDate = dateStr(field(objective, 'Target Date', 'Target Date'))
  const statusGroup = getTaskStatusGroup(objective)
  const isDone = statusGroup === 'done'
  const totalKr = krStats?.total ?? 0
  const donePct = totalKr === 0 ? 0 : Math.round((krStats?.done ?? 0) / totalKr * 100)

  return (
    <Link to={`/objectives/${objective.id}`} className="block">
      <Card
        title={name}
        icon={<IconTarget size={20} />}
        className={isDone ? 'opacity-90' : ''}
      >
        <div className="flex flex-wrap items-center gap-2">
          {priority && (
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getPriorityTagClass(priority)}`}>
              {priority}
            </span>
          )}
          {targetDate && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-border text-text-muted">
              {targetDate}
            </span>
          )}
          {category && <span className="text-sm text-text-muted">{category}</span>}
        </div>
        {totalKr > 0 && (
          <span className="text-xs text-text-muted">Key results: {totalKr} · {donePct}% done</span>
        )}
        {isDone && (
          <span className="inline-block mt-1 text-xs text-green-600 dark:text-green-400">Completed</span>
        )}
      </Card>
    </Link>
  )
}

function KeyResultCard({ kr }) {
  const name = str(field(kr, 'Key Result Name', 'Key Result Name')) || '(untitled)'
  const progress = Number(field(kr, 'Progress (%)', 'Progress', 'Progress %')) ?? 0
  const status = str(field(kr, 'Status', 'Status'))
  const deadline = dateStr(field(kr, 'Deadline', 'Deadline'))

  return (
    <Link to={`/key-results/${kr.id}`} className="block">
      <Card title={name}>
        <div className="flex items-center gap-2 mt-1">
          <div className="flex-1 h-2 rounded-full bg-border overflow-hidden">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            />
          </div>
          <span className="text-sm font-medium text-text-muted w-10">{progress}%</span>
        </div>
        <div className="flex flex-wrap gap-2 mt-2 text-sm text-text-muted">
          {status && <span>{status}</span>}
          {deadline && <span>Deadline: {deadline}</span>}
        </div>
      </Card>
    </Link>
  )
}

function TaskCard({ task }) {
  const name = str(field(task, 'Task Name', 'Task Name')) || '(untitled)'
  const description = str(field(task, 'Description', 'Description'))
  const priority = str(field(task, 'Priority', 'Priority'))
  const due = dateStr(field(task, 'Due Date', 'Due Date'))
  const statusGroup = getTaskStatusGroup(task)
  const isDone = statusGroup === 'done'

  return (
    <Link to={`/tasks/${task.id}`} className="block">
      <Card
        title={name}
        icon={<IconCheckSquare size={20} />}
        className={isDone ? 'opacity-90' : ''}
      >
        {description && (
          <p className="text-sm text-text-muted line-clamp-2 mb-2">{description}</p>
        )}
        <div className="flex flex-wrap items-center gap-2">
          {priority && (
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getPriorityTagClass(priority)}`}>
              {priority}
            </span>
          )}
          {due && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-border text-text-muted">
              {due}
            </span>
          )}
        </div>
        {isDone && (
          <span className="inline-block mt-1 text-xs text-green-600 dark:text-green-400">Completed</span>
        )}
      </Card>
    </Link>
  )
}

function RecipeCardSearch({ recipe }) {
  const name = str(field(recipe, 'Name')) || str(field(recipe, 'Name ES')) || '(untitled)'
  const nameES = str(field(recipe, 'Name ES'))
  const title = nameES && name !== nameES ? `${nameES} — ${name}` : name
  const mealTypes = arr(field(recipe, 'Meal Type'))
  const cuisineType = str(field(recipe, 'Cuisine Type'))
  const timeMins = num(field(recipe, 'Time to Cook (minutes)'))
  const servings = num(field(recipe, 'Servings'))

  return (
    <Link to={`/recipes/${recipe.id}`} className="block">
      <Card title={title} icon={<IconBook size={20} />} className="hover:ring-2 hover:ring-primary/30 transition-shadow">
        <div className="flex flex-wrap items-center gap-2 text-sm text-text-muted">
          {mealTypes.map((mt) => (
            <span key={mt} className="inline-flex px-2 py-0.5 rounded-lg bg-border text-text-muted font-medium">{mt}</span>
          ))}
          {cuisineType && <span className="inline-flex px-2 py-0.5 rounded-lg bg-border text-text-muted">{cuisineType}</span>}
          {timeMins != null && <span>{timeMins} min</span>}
          {servings != null && <span>{servings} servings</span>}
        </div>
      </Card>
    </Link>
  )
}

function IngredientCardSearch({ ingredient }) {
  const name = str(field(ingredient, 'Name')) || str(field(ingredient, 'Name ES')) || '(untitled)'
  const nameES = str(field(ingredient, 'Name ES'))
  const title = nameES && name !== nameES ? `${nameES} — ${name}` : name
  const category = str(field(ingredient, 'Category', 'Category'))

  return (
    <div className="block">
      <Card title={title} icon={<IconCircle size={20} />}>
        {category && <span className="text-sm text-text-muted">{category}</span>}
      </Card>
    </div>
  )
}

export function Search() {
  const { fetchApi } = usePlannerApi()
  const [query, setQuery] = useState('')
  const [hasSearchedInSession, setHasSearchedInSession] = useState(false)
  const [objectives, setObjectives] = useState([])
  const [keyResults, setKeyResults] = useState([])
  const [tasks, setTasks] = useState([])
  const [recipes, setRecipes] = useState([])
  const [ingredients, setIngredients] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [lastQuery, setLastQuery] = useState('')

  const runSearch = useCallback(() => {
    const q = normalizeQuery(query)
    if (!q) return
    setHasSearchedInSession(true)
    setLastQuery(q)
    setLoading(true)
    setError(null)
    Promise.all([
      fetchApi('/api/objectives').then((r) => r.data || []),
      fetchApi('/api/key-results').then((r) => r.data || []),
      fetchApi('/api/tasks').then((r) => r.data || []),
      fetchApi('/api/recipes').then((r) => r.data || []),
      fetchApi('/api/ingredients').then((r) => r.data || []),
    ])
      .then(([objs, krs, tks, recs, ings]) => {
        setObjectives(objs.filter((o) => matchObjective(o, q)))
        setKeyResults(krs.filter((kr) => matchKeyResult(kr, q)))
        setTasks(tks.filter((t) => matchTask(t, q)))
        setRecipes(recs.filter((r) => matchRecipe(r, q)))
        setIngredients(ings.filter((i) => matchIngredient(i, q)))
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [query, fetchApi])

  const clearSearch = useCallback(() => {
    setQuery('')
    setLastQuery('')
    setHasSearchedInSession(false)
    setObjectives([])
    setKeyResults([])
    setTasks([])
    setRecipes([])
    setIngredients([])
    setError(null)
  }, [])

  const krStatsByObjectiveId = useMemo(() => {
    const map = {}
    objectives.forEach((o) => {
      const linked = keyResults.filter((kr) => {
        const link = arr(field(kr, 'Objective Link', 'Objective'))
        return link && link.includes(o.id)
      })
      const done = linked.filter((kr) => getTaskStatusGroup(kr) === 'done').length
      map[o.id] = { total: linked.length, done }
    })
    return map
  }, [objectives, keyResults])

  const totalResults = objectives.length + keyResults.length + tasks.length + recipes.length + ingredients.length
  const showClear = hasSearchedInSession

  return (
    <div className="space-y-6">
      <PageHeader breadcrumbs={[{ label: 'Planner', to: '/' }, { label: 'Search' }]} />

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <SearchInput
            value={query}
            onChange={setQuery}
            onSearch={runSearch}
            onClear={clearSearch}
            showClear={showClear}
          />
        </div>
        <button
          type="button"
          onClick={runSearch}
          disabled={!query.trim() || loading}
          className="px-4 py-3 rounded-xl bg-primary text-primary-contrast font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Search
        </button>
      </div>

      {error && (
        <p className="text-red-600 dark:text-red-400">{error}</p>
      )}

      {loading && (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      )}

      {!loading && lastQuery && (
        <div className="space-y-4">
          {totalResults === 0 ? (
            <p className="text-text-muted">No results for “{lastQuery}”.</p>
          ) : (
            <>
              <p className="text-sm text-text-muted">
                {totalResults} result{totalResults !== 1 ? 's' : ''} for “{lastQuery}”
              </p>
              <div className="space-y-6">
                <CollapsibleGroup
                  label={GROUP_LABELS.objectives}
                  count={objectives.length}
                  initialCollapsed={false}
                >
                  {objectives.map((obj) => (
                    <li key={obj.id}>
                      <ObjectiveCard
                        objective={obj}
                        krStats={krStatsByObjectiveId[obj.id]}
                      />
                    </li>
                  ))}
                </CollapsibleGroup>
                <CollapsibleGroup
                  label={GROUP_LABELS.key_results}
                  count={keyResults.length}
                  initialCollapsed={false}
                >
                  {keyResults.map((kr) => (
                    <li key={kr.id}>
                      <KeyResultCard kr={kr} />
                    </li>
                  ))}
                </CollapsibleGroup>
                <CollapsibleGroup
                  label={GROUP_LABELS.tasks}
                  count={tasks.length}
                  initialCollapsed={false}
                >
                  {tasks.map((task) => (
                    <li key={task.id}>
                      <TaskCard task={task} />
                    </li>
                  ))}
                </CollapsibleGroup>
                <CollapsibleGroup
                  label={GROUP_LABELS.recipes}
                  count={recipes.length}
                  initialCollapsed={false}
                >
                  {recipes.map((recipe) => (
                    <li key={recipe.id}>
                      <RecipeCardSearch recipe={recipe} />
                    </li>
                  ))}
                </CollapsibleGroup>
                <CollapsibleGroup
                  label={GROUP_LABELS.ingredients}
                  count={ingredients.length}
                  initialCollapsed={false}
                >
                  {ingredients.map((ingredient) => (
                    <li key={ingredient.id}>
                      <IngredientCardSearch ingredient={ingredient} />
                    </li>
                  ))}
                </CollapsibleGroup>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
