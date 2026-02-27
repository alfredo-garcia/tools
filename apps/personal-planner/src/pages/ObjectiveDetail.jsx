import { useState, useEffect, useCallback, useMemo } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useApi, Spinner, PageHeader, Card, IconTarget, IconPriority, IconCalendar, IconTag, IconCircle, IconPlay, IconCheckSquare, IconTrash } from '@tools/shared'
import { field, str, dateStr, arr, num } from '@tools/shared'
import { getTaskStatusGroup } from '../lib/taskStatus'
import { getPriorityTagClass, STATUS_OPTIONS } from '../components/TaskCard'
import { KeyResultCreateModal } from '../components/KeyResultCreateModal'
import { Fab } from '@tools/shared'

const PRIORITY_OPTIONS = ['Low', 'Medium', 'High']

function KeyResultCard({ kr, taskStats }) {
  const name = str(field(kr, 'Key Result Name', 'Key Result Name')) || '(untitled)'
  const status = str(field(kr, 'Status', 'Status'))

  const totalTasks = taskStats?.total ?? 0
  const doneTasks = taskStats?.done ?? 0
  const inProgressTasks = taskStats?.inProgress ?? 0
  const pendingTasks = taskStats?.pending ?? 0

  const donePct = totalTasks === 0 ? 0 : Math.round((doneTasks / totalTasks) * 100)
  const inProgressPct = totalTasks === 0 ? 0 : Math.round((inProgressTasks / totalTasks) * 100)
  const pendingPct = totalTasks === 0 ? 0 : Math.round((pendingTasks / totalTasks) * 100)
  const progressBarTitle = totalTasks === 0
    ? 'No tasks'
    : `Done: ${donePct}%, In progress: ${inProgressPct}%, To do: ${pendingPct}%`

  return (
    <Link to={`/key-results/${kr.id}`} className="block">
      <Card title={name} className="hover:ring-2 hover:ring-primary/30 transition-shadow">
        <div className="space-y-2">
          {totalTasks > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-text-muted shrink-0" title={progressBarTitle}>
                ({totalTasks})
              </span>
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
              <span className="text-xs font-medium text-text-muted shrink-0">
                {donePct}%
              </span>
            </div>
          )}
          {status && (
            <span className="text-xs text-text-muted">{status}</span>
          )}
        </div>
      </Card>
    </Link>
  )
}

export function ObjectiveDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { fetchApi } = useApi()
  const [item, setItem] = useState(null)
  const [keyResults, setKeyResults] = useState([])
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [editingField, setEditingField] = useState(null)
  const [editValue, setEditValue] = useState('')
  const [createKrOpen, setCreateKrOpen] = useState(false)

  const refetch = useCallback((silent = false) => {
    if (!silent) {
      setLoading(true)
      setError(null)
    }
    Promise.allSettled([
      fetchApi('/api/objectives').then((r) => r.data.find((o) => o.id === id) || null),
      fetchApi('/api/key-results').then((r) => r.data || []),
      fetchApi('/api/tasks').then((r) => r.data || []),
    ]).then(([objRes, krsRes, tasksRes]) => {
      const obj = objRes.status === 'fulfilled' ? objRes.value : null
      if (obj != null) setItem(obj)
      if (krsRes.status === 'fulfilled' && obj) {
        const krs = krsRes.value || []
        setKeyResults(krs.filter((kr) => arr(field(kr, 'Objective Link', 'Objective')).includes(obj.id)))
      }
      if (tasksRes.status === 'fulfilled') setTasks(tasksRes.value || [])
    }).finally(() => setLoading(false))
  }, [fetchApi, id])

  useEffect(() => {
    refetch()
  }, [refetch])

  const handleObjectiveUpdate = useCallback(async (fields) => {
    if (!item) return
    try {
      await fetchApi(`/api/objectives/${item.id}`, {
        method: 'PATCH',
        body: JSON.stringify(fields),
      })
      setItem((prev) => (prev ? { ...prev, ...fields } : null))
      setEditingField(null)
    } catch (e) {
      console.error(e)
    }
    refetch(true)
  }, [fetchApi, item, refetch])

  const handleStatus = useCallback(async (e, newStatus) => {
    e?.stopPropagation?.()
    if (!item) return
    try {
      await fetchApi(`/api/objectives/${item.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ Status: newStatus }),
      })
      setItem((prev) => (prev ? { ...prev, Status: newStatus } : null))
    } catch (err) {
      console.error(err)
    }
    refetch(true)
  }, [fetchApi, item, refetch])

  const handleDelete = useCallback(async () => {
    if (!item) return
    try {
      await fetchApi(`/api/objectives/${item.id}`, { method: 'DELETE' })
      navigate('/objectives')
    } catch (err) {
      console.error(err)
    }
  }, [fetchApi, item, navigate])

  const handleCreateKeyResult = useCallback(
    async (fields) => {
      await fetchApi('/api/key-results', { method: 'POST', body: JSON.stringify(fields) })
      refetch()
    },
    [fetchApi, refetch]
  )

  const title = str(field(item, 'Objective Name', 'Objective Name')) || 'Objective'
  const description = str(field(item, 'Description', 'Description')) || ''
  const category = str(field(item, 'Category', 'Category')) || ''
  const status = str(field(item, 'Status', 'Status')) || ''
  const priority = str(field(item, 'Priority', 'Priority')) || ''
  const startDate = dateStr(field(item, 'Start Date', 'Start Date')) || ''
  const targetDate = dateStr(field(item, 'Target Date', 'Target Date')) || ''

  const krStatusCounts = useMemo(() => {
    const done = keyResults.filter((kr) => getTaskStatusGroup(kr) === 'done').length
    const inProgress = keyResults.filter((kr) => getTaskStatusGroup(kr) === 'in_progress').length
    const pending = keyResults.filter((kr) => getTaskStatusGroup(kr) === 'pending').length
    return { done, inProgress, pending, total: keyResults.length }
  }, [keyResults])

  const krTasksStatsById = useMemo(() => {
    const map = {}
    keyResults.forEach((kr) => {
      const tasksForKr = (tasks || []).filter((t) => {
        const krLinks = arr(field(t, 'Key Result', 'Key Results'))
        return krLinks.includes(kr.id)
      })
      const done = tasksForKr.filter((t) => getTaskStatusGroup(t) === 'done').length
      const inProgress = tasksForKr.filter((t) => getTaskStatusGroup(t) === 'in_progress').length
      const pending = tasksForKr.filter((t) => getTaskStatusGroup(t) === 'pending').length
      map[kr.id] = { total: tasksForKr.length, done, inProgress, pending }
    })
    return map
  }, [keyResults, tasks])

  const doneKrs = krStatusCounts.done
  const inProgressKrs = krStatusCounts.inProgress
  const pendingKrs = krStatusCounts.pending
  const totalKrs = krStatusCounts.total
  const doneKrsPct = totalKrs === 0 ? 0 : Math.round((doneKrs / totalKrs) * 100)
  const inProgressKrsPct = totalKrs === 0 ? 0 : Math.round((inProgressKrs / totalKrs) * 100)
  const pendingKrsPct = totalKrs === 0 ? 0 : Math.round((pendingKrs / totalKrs) * 100)
  const krsBarTitle = totalKrs === 0
    ? 'No key results'
    : `Done: ${doneKrsPct}%, In progress: ${inProgressKrsPct}%, To do: ${pendingKrsPct}%`

  if (loading && !item) return <div className="flex justify-center py-12"><Spinner size="lg" /></div>
  if (error && !item) return <p className="text-red-600 dark:text-red-400">{error}</p>
  if (!item) return <p className="text-text-muted">Objective not found.</p>

  const startEdit = (fieldName, currentValue) => {
    setEditingField(fieldName)
    setEditValue(currentValue ?? '')
  }

  const handleBlurName = async () => {
    if (editingField !== 'name') return
    const v = editValue.trim()
    await handleObjectiveUpdate({ 'Objective Name': v || title || '(untitled)' })
    setEditingField(null)
  }

  const handleBlurDescription = async () => {
    if (editingField !== 'description') return
    await handleObjectiveUpdate({ Description: editValue })
    setEditingField(null)
  }

  const handleBlurCategory = async () => {
    if (editingField !== 'category') return
    await handleObjectiveUpdate({ Category: editValue.trim() })
    setEditingField(null)
  }

  const handleChangeStartDate = async (v) => {
    await handleObjectiveUpdate({ 'Start Date': v || null })
    setEditingField(null)
  }

  const handleChangeTargetDate = async (v) => {
    await handleObjectiveUpdate({ 'Target Date': v || null })
    setEditingField(null)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={[{ label: 'Home', to: '/' }, { label: 'OKRs', to: '/objectives' }, { label: title }]}
        onRefresh={refetch}
        loading={loading}
      />

      {/* Card Objective: título + datos editables estilo Task modal */}
      <div className="rounded-2xl border border-2 border-border bg-surface overflow-hidden">
        <div className="p-5 border-b border-border flex items-center justify-between gap-3">
          {editingField === 'name' ? (
            <input
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={handleBlurName}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleBlurName() } }}
              className="flex-1 min-w-0 font-bold text-xl text-text bg-surface border border-border rounded-lg px-2 py-1"
              autoFocus
            />
          ) : (
            <h1
              role="button"
              tabIndex={0}
              onClick={() => startEdit('name', title)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); startEdit('name', title) } }}
              className="font-bold text-xl text-text truncate flex-1 min-w-0 cursor-pointer rounded hover:bg-border/50 py-1 -mx-1 px-1 flex items-center gap-2"
            >
              <span className="shrink-0 text-text-muted"><IconTarget size={22} /></span>
              {title || '(untitled)'}
            </h1>
          )}
        </div>

        <div className="p-5 space-y-4">
          {/* Description */}
          {editingField === 'description' ? (
            <textarea
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={handleBlurDescription}
              className="w-full text-sm font-normal text-text bg-surface border border-border rounded-lg px-3 py-2 min-h-[80px] resize-y"
              placeholder="Description"
              autoFocus
            />
          ) : (
            <p
              role="button"
              tabIndex={0}
              onClick={() => startEdit('description', description)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); startEdit('description', description) } }}
              className="text-sm font-normal text-text whitespace-pre-wrap cursor-pointer rounded hover:bg-border/50 py-2 -mx-2 px-2 min-h-[2rem]"
            >
              {description || '(no description)'}
            </p>
          )}

          <hr className="border-border" />

          <div className="space-y-2">
            {/* Priority */}
            <div className="flex items-center gap-2 text-sm">
              <span className="text-text-muted shrink-0"><IconPriority size={18} /></span>
              <span className="text-text-muted shrink-0">Priority:</span>
              {editingField === 'priority' ? (
                <select
                  value={editValue}
                  onChange={(e) => { const v = e.target.value; handleObjectiveUpdate({ Priority: v }); setEditValue(v); setEditingField(null) }}
                  onBlur={() => setEditingField(null)}
                  className="rounded border border-border bg-surface text-text px-2 py-1 text-sm"
                  autoFocus
                >
                  <option value="">—</option>
                  {PRIORITY_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              ) : (
                <span
                  role="button"
                  tabIndex={0}
                  onClick={() => startEdit('priority', priority)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); startEdit('priority', priority) } }}
                  className={`inline-flex px-1.5 py-0.5 rounded text-xs font-medium cursor-pointer ${getPriorityTagClass(priority)} hover:ring-2 ring-offset-2 ring-border`}
                >
                  {priority || '—'}
                </span>
              )}
            </div>

            {/* Category */}
            <div className="flex items-center gap-2 text-sm">
              <span className="text-text-muted shrink-0"><IconTag size={18} /></span>
              <span className="text-text-muted shrink-0">Category:</span>
              {editingField === 'category' ? (
                <input
                  type="text"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onBlur={handleBlurCategory}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleBlurCategory() } }}
                  className="rounded border border-border bg-surface text-text px-2 py-1 text-sm flex-1 min-w-0"
                  autoFocus
                />
              ) : (
                <span
                  role="button"
                  tabIndex={0}
                  onClick={() => startEdit('category', category)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); startEdit('category', category) } }}
                  className="text-text cursor-pointer rounded hover:bg-border/50 py-0.5 px-1 flex-1 min-w-0"
                >
                  {category || '—'}
                </span>
              )}
            </div>

            {/* Start date */}
            <div className="flex items-center gap-2 text-sm">
              <span className="text-text-muted shrink-0"><IconCalendar size={18} /></span>
              <span className="text-text-muted shrink-0">Start date:</span>
              {editingField === 'startDate' ? (
                <input
                  type="date"
                  value={editValue}
                  onChange={(e) => { const v = e.target.value; handleChangeStartDate(v) }}
                  onBlur={() => setEditingField(null)}
                  className="rounded border border-border bg-surface text-text px-2 py-1 text-sm"
                  autoFocus
                />
              ) : (
                <span
                  role="button"
                  tabIndex={0}
                  onClick={() => startEdit('startDate', startDate)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); startEdit('startDate', startDate) } }}
                  className="text-text cursor-pointer rounded hover:bg-border/50 py-0.5 px-1"
                >
                  {startDate || '—'}
                </span>
              )}
            </div>

            {/* Target date */}
            <div className="flex items-center gap-2 text-sm">
              <span className="text-text-muted shrink-0"><IconCalendar size={18} /></span>
              <span className="text-text-muted shrink-0">Target date:</span>
              {editingField === 'targetDate' ? (
                <input
                  type="date"
                  value={editValue}
                  onChange={(e) => { const v = e.target.value; handleChangeTargetDate(v) }}
                  onBlur={() => setEditingField(null)}
                  className="rounded border border-border bg-surface text-text px-2 py-1 text-sm"
                  autoFocus
                />
              ) : (
                <span
                  role="button"
                  tabIndex={0}
                  onClick={() => startEdit('targetDate', targetDate)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); startEdit('targetDate', targetDate) } }}
                  className="text-text cursor-pointer rounded hover:bg-border/50 py-0.5 px-1"
                >
                  {targetDate || '—'}
                </span>
              )}
            </div>

          </div>
          <hr className="border-border" />
          <div className="flex items-center justify-between gap-2 w-full flex-wrap">
            <div className="flex flex-wrap gap-2">
              {STATUS_OPTIONS.map(({ value, label }) => {
                const statusGroup = getTaskStatusGroup(item)
                const isActive =
                  (value === 'Done' && statusGroup === 'done') ||
                  (value === 'In Progress' && statusGroup === 'in_progress') ||
                  (value === 'Pending' && statusGroup === 'pending')
                const isPending = value === 'Pending'
                const isInProgress = value === 'In Progress'
                const btnClass = isActive
                  ? isPending
                    ? 'bg-status-pending text-white'
                    : isInProgress
                      ? 'bg-status-in-progress text-white'
                      : 'bg-status-done text-white'
                  : 'bg-border text-text hover:bg-border/80'
                const Icon = isPending ? IconCircle : isInProgress ? IconPlay : IconCheckSquare
                return (
                  <button
                    key={value}
                    type="button"
                    title={label}
                    onClick={(e) => handleStatus(e, value)}
                    className={`min-h-[44px] px-3 md:px-4 rounded-xl text-sm font-medium flex items-center justify-center md:justify-start gap-2 shrink-0 cursor-pointer ${btnClass}`}
                  >
                    <Icon size={18} />
                    <span className="hidden md:inline">{label}</span>
                  </button>
                )
              })}
            </div>
            <button
              type="button"
              onClick={handleDelete}
              title="Delete objective"
              className="min-h-[44px] px-3 rounded-xl flex items-center justify-center shrink-0 bg-transparent text-text-muted hover:bg-red-500/20 hover:text-red-600 dark:hover:text-red-400 transition-colors"
            >
              <IconTrash size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Sección Key Results */}
      {keyResults.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-base font-semibold text-text">Key Results</h2>
          {/* Barra de progreso de Key Results */}
          <div className="flex items-center gap-2 w-full">
            <span className="text-sm font-medium text-text-muted shrink-0" title={krsBarTitle}>
              ({totalKrs})
            </span>
            <div
              className="flex-1 h-2 rounded-full overflow-hidden flex min-w-0"
              role="progressbar"
              aria-valuenow={doneKrsPct}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={krsBarTitle}
              title={krsBarTitle}
            >
              {totalKrs === 0 ? (
                <div className="h-full bg-status-pending shrink-0 w-full" />
              ) : (
                <>
                  {doneKrsPct > 0 && <div className="h-full bg-status-done shrink-0" style={{ width: `${doneKrsPct}%` }} />}
                  {inProgressKrsPct > 0 && <div className="h-full bg-status-in-progress shrink-0" style={{ width: `${inProgressKrsPct}%` }} />}
                  {pendingKrsPct > 0 && <div className="h-full bg-status-pending shrink-0" style={{ width: `${pendingKrsPct}%` }} />}
                </>
              )}
            </div>
            <span className="text-sm font-medium text-text-muted shrink-0">
              {doneKrsPct}%
            </span>
          </div>

          {/* Cards de Key Results */}
          <ul className="space-y-2 list-none p-0 m-0">
            {keyResults.map((kr) => (
              <li key={kr.id}>
                <KeyResultCard kr={kr} taskStats={krTasksStatsById[kr.id]} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {keyResults.length === 0 && (
        <p className="text-text-muted">No key results linked to this objective.</p>
      )}

      {createKrOpen && item && (
        <KeyResultCreateModal
          objectiveId={item.id}
          onClose={() => setCreateKrOpen(false)}
          onCreate={handleCreateKeyResult}
        />
      )}

      <Fab onClick={() => setCreateKrOpen(true)} ariaLabel="Create key result" />
    </div>
  )
}
