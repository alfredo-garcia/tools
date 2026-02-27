import { useState, useEffect, useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useApi, Spinner, PageHeader, Card, CardList, IconTarget } from '@tools/shared'
import { field, str, dateStr, arr } from '@tools/shared'
import { getTaskStatusGroup } from '../lib/taskStatus'
import { getPriorityTagClass } from '../components/TaskCard'

const GROUP_ORDER = ['in_progress', 'pending', 'done']
const GROUP_LABELS = {
  in_progress: 'In progress',
  pending: 'Pending',
  done: 'Done',
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
  const inProgressPct = totalKr === 0 ? 0 : Math.round((krStats?.inProgress ?? 0) / totalKr * 100)
  const pendingPct = totalKr === 0 ? 0 : Math.round((krStats?.pending ?? 0) / totalKr * 100)
  const progressBarTitle = totalKr === 0
    ? 'No key results'
    : `Done: ${donePct}%, In progress: ${inProgressPct}%, To do: ${pendingPct}%`

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
          {category && (
            <span className="text-sm text-text-muted">{category}</span>
          )}
        </div>
        {totalKr > 0 && (
          <div className="mt-2 flex items-center gap-2">
            <span className="text-xs font-medium text-text-muted shrink-0" title={progressBarTitle}>({totalKr})</span>
            <div
              className="flex-1 h-2 rounded-full overflow-hidden flex min-w-0"
              role="progressbar"
              aria-valuenow={donePct}
              aria-valuemin={0}
              aria-valuemax={100}
              title={progressBarTitle}
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
  const { fetchApi } = useApi()
  const [list, setList] = useState([])
  const [keyResults, setKeyResults] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const refetch = useCallback(() => {
    setLoading(true)
    setError(null)
    Promise.all([
      fetchApi('/api/objectives').then((r) => r.data || []),
      fetchApi('/api/key-results').then((r) => r.data || []),
    ])
      .then(([objectives, krs]) => {
        setList(objectives)
        setKeyResults(krs)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [fetchApi])

  useEffect(() => {
    refetch()
  }, [refetch])

  const krStatsByObjectiveId = useMemo(() => {
    const map = {}
    list.forEach((o) => {
      const linked = (keyResults || []).filter((kr) => {
        const link = arr(field(kr, 'Objective Link', 'Objective'))
        return link.includes(o.id)
      })
      const done = linked.filter((kr) => getTaskStatusGroup(kr) === 'done').length
      const inProgress = linked.filter((kr) => getTaskStatusGroup(kr) === 'in_progress').length
      const pending = linked.filter((kr) => getTaskStatusGroup(kr) === 'pending').length
      map[o.id] = { total: linked.length, done, inProgress, pending }
    })
    return map
  }, [list, keyResults])

  const groupBy = getTaskStatusGroup
  const initialCollapsed = { in_progress: false, pending: false, done: true }

  const groups = GROUP_ORDER.reduce((acc, key) => {
    acc[key] = list.filter((o) => groupBy(o) === key)
    return acc
  }, {})
  const doneCount = groups.done.length
  const inProgressCount = groups.in_progress.length
  const pendingCount = groups.pending.length
  const total = list.length
  const donePct = total === 0 ? 0 : Math.round((doneCount / total) * 100)
  const inProgressPct = total === 0 ? 0 : Math.round((inProgressCount / total) * 100)
  const pendingPct = total === 0 ? 0 : Math.round((pendingCount / total) * 100)
  const kpiBarTitle = total === 0
    ? 'No objectives'
    : `Done: ${donePct}%, In progress: ${inProgressPct}%, To do: ${pendingPct}%`

  const renderItem = (objective) => (
    <ObjectiveCard
      key={objective.id}
      objective={objective}
      krStats={krStatsByObjectiveId[objective.id]}
    />
  )

  if (loading && list.length === 0) return <div className="flex justify-center py-12"><Spinner size="lg" /></div>
  if (error && list.length === 0) return <p className="text-red-600 dark:text-red-400">{error}</p>

  return (
    <div className="space-y-6">
      <PageHeader breadcrumbs={[{ label: 'Home', to: '/' }, { label: 'OKRs', to: '/objectives' }]} onRefresh={refetch} loading={loading} />

      <div className="flex items-center gap-2 w-full">
        <span className="text-sm font-medium text-text-muted shrink-0" title={kpiBarTitle}>({total})</span>
        <div
          className="flex-1 h-2 rounded-full overflow-hidden flex min-w-0"
          role="progressbar"
          aria-valuenow={donePct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={kpiBarTitle}
          title={kpiBarTitle}
        >
          {total === 0 ? (
            <div className="h-full bg-status-pending shrink-0 w-full" />
          ) : (
            <>
              {donePct > 0 && <div className="h-full bg-status-done shrink-0" style={{ width: `${donePct}%` }} />}
              {inProgressPct > 0 && <div className="h-full bg-status-in-progress shrink-0" style={{ width: `${inProgressPct}%` }} />}
              {pendingPct > 0 && <div className="h-full bg-status-pending shrink-0" style={{ width: `${pendingPct}%` }} />}
            </>
          )}
        </div>
        <span className="text-sm font-medium text-text-muted shrink-0">{donePct}%</span>
      </div>

      <CardList
        items={list}
        groupBy={groupBy}
        groupOrder={GROUP_ORDER}
        groupLabels={GROUP_LABELS}
        renderItem={renderItem}
        initialCollapsed={initialCollapsed}
      />

      {list.length === 0 && (
        <p className="text-text-muted">No objectives.</p>
      )}
    </div>
  )
}
