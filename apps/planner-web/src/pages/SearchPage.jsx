import { useState, useEffect, useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Spinner,
  PageHeader,
  Card,
  IconSearch,
  IconX,
  IconTarget,
  IconCheckSquare,
  IconBook,
  IconCircle,
} from '@tools/shared'
import { usePlannerApi } from '../contexts/PlannerApiContext'

const ALL_QUERY = `
  query SearchData {
    tasks { id taskName status dueDate }
    habits { id name }
    objectives { id objectiveName status }
    keyResults { id keyResultName status }
    recipes { id name nameES }
    ingredients { id name nameES }
  }
`

function normalizeQuery(q) {
  return (q || '').toLowerCase().trim().replace(/\s+/g, ' ')
}

function matchText(text, query) {
  if (!query || !text) return false
  return normalizeQuery(String(text)).includes(normalizeQuery(query))
}

function matchNameAndNameES(item, query) {
  const name = item?.name || item?.taskName || item?.objectiveName || item?.keyResultName
  const nameES = item?.nameES
  return matchText(name, query) || matchText(nameES, query)
}

export function SearchPage() {
  const { graphql } = usePlannerApi()
  const [search, setSearch] = useState('')
  const [submitted, setSubmitted] = useState('')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await graphql(ALL_QUERY)
      setData(result)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [graphql])

  useEffect(() => {
    load()
  }, [load])

  const handleSearch = () => setSubmitted(search)
  const handleClear = () => {
    setSearch('')
    setSubmitted('')
  }

  const results = useMemo(() => {
    if (!submitted || !data) return { objectives: [], keyResults: [], tasks: [], recipes: [], ingredients: [], habits: [] }
    const q = normalizeQuery(submitted)
    const match = (item, ...fields) => fields.some((f) => matchText(item?.[f], submitted)) || matchNameAndNameES(item, submitted)
    return {
      objectives: (data.objectives || []).filter((o) => match(o, 'objectiveName', 'category')),
      keyResults: (data.keyResults || []).filter((kr) => match(kr, 'keyResultName', 'status')),
      tasks: (data.tasks || []).filter((t) => match(t, 'taskName', 'description')),
      recipes: (data.recipes || []).filter((r) => match(r, 'name', 'nameES', 'description')),
      ingredients: (data.ingredients || []).filter((i) => match(i, 'name', 'nameES', 'description')),
      habits: (data.habits || []).filter((h) => match(h, 'name', 'description')),
    }
  }, [data, submitted])

  const total =
    results.objectives.length +
    results.keyResults.length +
    results.tasks.length +
    results.recipes.length +
    results.ingredients.length +
    results.habits.length

  return (
    <div className="space-y-6">
      <PageHeader title="Search" />
      <div className="relative flex items-center">
        <span className="absolute left-3 pointer-events-none text-text-muted">
          <IconSearch size={20} />
        </span>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="Search objectives, key results, tasks, recipes, ingredients, habits…"
          className="w-full pl-10 pr-10 py-3 rounded-xl border-2 border-border bg-surface text-text placeholder:text-text-muted focus:outline-none focus:border-primary"
          aria-label="Search"
        />
        {search && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2 p-1.5 rounded-lg text-text-muted hover:bg-border hover:text-text"
            aria-label="Clear search"
          >
            <IconX size={20} />
          </button>
        )}
      </div>
      <button
        type="button"
        onClick={handleSearch}
        className="px-4 py-2 rounded-xl bg-primary text-white font-medium hover:opacity-90"
      >
        Search
      </button>

      {error && (
        <p className="text-red-600 dark:text-red-400 text-sm" role="alert">
          {error}
        </p>
      )}
      {loading ? (
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      ) : submitted ? (
        <div className="space-y-6">
          <p className="text-text-muted text-sm">
            {total} result{total !== 1 ? 's' : ''} for “{submitted}”
          </p>
          {results.objectives.length > 0 && (
            <section>
              <h2 className="text-lg font-bold text-text mb-2">Objectives</h2>
              <ul className="space-y-2">
                {results.objectives.map((o) => (
                  <li key={o.id}>
                    <Link to={`/objectives/${o.id}`} className="block">
                      <Card title={o.objectiveName || o.id} icon={<IconTarget size={18} />} />
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
          {results.keyResults.length > 0 && (
            <section>
              <h2 className="text-lg font-bold text-text mb-2">Key Results</h2>
              <ul className="space-y-2">
                {results.keyResults.map((kr) => (
                  <li key={kr.id}>
                    <Link to={`/key-results/${kr.id}`} className="block">
                      <Card title={kr.keyResultName || kr.id} />
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
          {results.tasks.length > 0 && (
            <section>
              <h2 className="text-lg font-bold text-text mb-2">Tasks</h2>
              <ul className="space-y-2">
                {results.tasks.map((t) => (
                  <li key={t.id}>
                    <Link to={`/tasks/${t.id}`} className="block">
                      <Card title={t.taskName || t.id} icon={<IconCheckSquare size={18} />} />
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
          {results.recipes.length > 0 && (
            <section>
              <h2 className="text-lg font-bold text-text mb-2">Recipes</h2>
              <ul className="space-y-2">
                {results.recipes.map((r) => (
                  <li key={r.id}>
                    <Link to={`/recipes/${r.id}`} className="block">
                      <Card title={r.nameES || r.name || r.id} icon={<IconBook size={18} />} />
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
          {results.habits.length > 0 && (
            <section>
              <h2 className="text-lg font-bold text-text mb-2">Habits</h2>
              <ul className="space-y-2">
                {results.habits.map((h) => (
                  <li key={h.id}>
                    <Link to={`/habits/${h.id}`} className="block">
                      <Card title={h.name || h.id} icon={<IconCircle size={18} />} />
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
          {total === 0 && (
            <p className="text-text-muted text-center py-8">No results. Try another query.</p>
          )}
        </div>
      ) : (
        <p className="text-text-muted text-center py-8">Enter a search term and press Search or Enter.</p>
      )}
    </div>
  )
}
