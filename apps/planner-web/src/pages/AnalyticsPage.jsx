import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader, KpiCard, Spinner } from '@tools/shared'
import { usePlannerApi } from '../contexts/PlannerApiContext'
import { getTodayStr } from '@tools/shared'

const SUMMARY_QUERY = `
  query Summary($week: String!) { plannerSummary(week: $week) { week taskCount habitCount mealsCount } }
`

export function AnalyticsPage() {
  const { graphql } = usePlannerApi()
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    const week = getTodayStr()
    setLoading(true)
    setError(null)
    try {
      const data = await graphql(SUMMARY_QUERY, { week })
      setSummary(data?.plannerSummary ?? null)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [graphql])

  useEffect(() => {
    load()
  }, [load])

  return (
    <div className="space-y-6">
      <PageHeader title="Analytics" onRefresh={load} loading={loading} />
      {error && (
        <p className="text-red-600 dark:text-red-400 text-sm" role="alert">{error}</p>
      )}
      {loading && !summary ? (
        <div className="flex justify-center py-8"><Spinner /></div>
      ) : summary ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <KpiCard label="Tasks" value={summary.taskCount ?? 0} />
            <KpiCard label="Habits" value={summary.habitCount ?? 0} />
            <KpiCard label="Meals (this week)" value={summary.mealsCount ?? 0} />
          </div>
          <nav className="mt-6 flex flex-wrap gap-2" aria-label="Analysis links">
            <Link to="/analysis/okr" className="px-4 py-2 rounded-xl bg-surface border border-border hover:border-primary text-sm font-medium">
              OKR analysis
            </Link>
            <Link to="/analysis/tasks" className="px-4 py-2 rounded-xl bg-surface border border-border hover:border-primary text-sm font-medium">
              Tasks analysis
            </Link>
            <Link to="/analysis/habits" className="px-4 py-2 rounded-xl bg-surface border border-border hover:border-primary text-sm font-medium">
              Habits analysis
            </Link>
          </nav>
        </>
      ) : null}
    </div>
  )
}
