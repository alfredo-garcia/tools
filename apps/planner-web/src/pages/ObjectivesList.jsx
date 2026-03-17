import { useState, useEffect, useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Spinner,
  PageHeader,
  Card,
  CardList,
  EntityListPage,
  IconTarget,
  Fab,
  StatusProgressBar,
} from '@tools/shared'
import { usePlannerApi } from '../contexts/PlannerApiContext'
import { getTaskStatusGroup, getTaskStatusBreakdown } from '../lib/taskStatus'
import { getPriorityTagClass } from '../lib/priorityTagClass'
import { ObjectiveModal } from '../components/ObjectiveModal'

const OBJECTIVES_QUERY = `
  query { objectives { id objectiveName status description category priority startDate targetDate lastModified } }
`
const KEY_RESULTS_QUERY = `
  query { keyResults { id keyResultName status objectiveLink lastModified } }
`

function ObjectiveCard({ objective, krStats }) {
  const name = objective.objectiveName || '(untitled)'
  const category = objective.category || ''
  const priority = objective.priority || ''
  const targetDate = objective.targetDate || ''
  const statusGroup = getTaskStatusGroup(objective)
  const isDone = statusGroup === 'done'

  const totalKr = krStats?.total ?? 0
  const donePct = totalKr === 0 ? 0 : Math.round((krStats?.done ?? 0) / totalKr * 100)
  const inProgressPct = totalKr === 0 ? 0 : Math.round((krStats?.in_progress ?? 0) / totalKr * 100)
  const pendingPct = totalKr === 0 ? 0 : Math.round((krStats?.pending ?? 0) / totalKr * 100)

  return (
    <Link to={`/objectives/${objective.id}`} className="block">
      <Card title={name} icon={<IconTarget size={20} />} className={isDone ? 'opacity-90' : ''}>
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
          <div className="mt-2 flex items-center gap-2">
            <span className="text-xs font-medium text-text-muted shrink-0" title={`KRs: ${krStats?.done ?? 0} done, ${krStats?.in_progress ?? 0} in progress, ${krStats?.pending ?? 0} pending`}>
              ({totalKr})
            </span>
            <div
              className="flex-1 h-2 rounded-full overflow-hidden flex min-w-0"
              role="progressbar"
              aria-valuenow={donePct}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              {donePct > 0 && <div className="h-full bg-status-done shrink-0" style={{ width: `${donePct}%` }} />}
              {inProgressPct > 0 && <div className="h-full bg-status-in-progress shrink-0" style={{ width: `${inProgressPct}%` }} />}
              {pendingPct > 0 && <div className="h-full bg-status-pending shrink-0" style={{ width: `${pendingPct}%` }} />}
            </div>
            <span className="text-xs font-medium text-text-muted shrink-0">{donePct}%</span>
          </div>
        )}
        {isDone && (
          <span className="inline-block mt-1 text-xs text-green-600 dark:text-green-400">Completed</span>
        )}
      </Card>
    </Link>
  )
}

export function ObjectivesList() {
  const { graphql } = usePlannerApi()
  const [objectives, setObjectives] = useState([])
  const [keyResults, setKeyResults] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [createOpen, setCreateOpen] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [objData, krData] = await Promise.all([
        graphql(OBJECTIVES_QUERY),
        graphql(KEY_RESULTS_QUERY),
      ])
      setObjectives(objData?.objectives ?? [])
      setKeyResults(krData?.keyResults ?? [])
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [graphql])

  useEffect(() => {
    load()
  }, [load])

  const breakdown = useMemo(() => getTaskStatusBreakdown(objectives), [objectives])

  const krStatsByObjectiveId = useMemo(() => {
    const map = {}
    for (const o of objectives) {
      const krs = keyResults.filter((kr) => (kr.objectiveLink || []).includes(o.id))
      const counts = { total: krs.length, done: 0, in_progress: 0, pending: 0 }
      for (const kr of krs) {
        const g = getTaskStatusGroup(kr)
        if (g === 'done') counts.done += 1
        else if (g === 'in_progress') counts.in_progress += 1
        else counts.pending += 1
      }
      map[o.id] = counts
    }
    return map
  }, [objectives, keyResults])

  return (
    <EntityListPage
      header={<PageHeader title="OKRs" onRefresh={load} loading={loading} />}
      showEmptyState={!loading && objectives.length === 0}
      emptyState={<p className="text-text-muted text-center py-8">No objectives yet.</p>}
    >
      {error && (
        <p className="text-red-600 dark:text-red-400 text-sm mb-4" role="alert">
          {error}
        </p>
      )}
      {!loading && objectives.length > 0 && (
        <div className="mb-4 flex items-center gap-3">
          <span className="text-sm font-medium text-text">Objectives</span>
          <span className="text-sm text-text-muted">{breakdown.total}</span>
          <StatusProgressBar
            segments={breakdown.counts}
            total={breakdown.total}
            ariaLabel="Objective progress by status"
            className="max-w-[200px]"
          />
          <span className="text-xs text-text-muted">{breakdown.percentages.done}% done</span>
        </div>
      )}
      {loading && objectives.length === 0 ? (
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      ) : (
        <CardList>
          {objectives.map((o) => (
            <li key={o.id}>
              <ObjectiveCard objective={o} krStats={krStatsByObjectiveId[o.id]} />
            </li>
          ))}
        </CardList>
      )}
      <Fab onClick={() => setCreateOpen(true)} ariaLabel="Create objective" />
      {createOpen && (
        <ObjectiveModal onClose={() => setCreateOpen(false)} onSaved={load} />
      )}
    </EntityListPage>
  )
}
