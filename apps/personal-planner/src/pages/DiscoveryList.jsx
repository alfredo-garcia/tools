import { useState, useEffect, useCallback, useMemo } from 'react'
import { Spinner, PageHeader, Card, CardList, IconMagicBall, IconSearch, FilterBar, FilterDropdown } from '@tools/shared'
import { usePlannerApi } from '../contexts/PlannerApiContext'
import { field, str, dateStr } from '@tools/shared'
import { getPriorityTagClass } from '../components/TaskCard'
import { DiscoveryModal } from '../components/DiscoveryModal'
import { Fab } from '@tools/shared'
import { STATUS_OPTIONS, getStatusLabel, filterByStatus, filterBySearch } from '../lib/discoveryListUtils'

/** Priority order for grouping. Items with other/empty priority go last. */
const PRIORITY_ORDER = ['High', 'Medium', 'Low']
const PRIORITY_OPTIONS = PRIORITY_ORDER.map((p) => ({ value: p, label: p }))
const GROUP_ORDER = [...PRIORITY_ORDER, '_other']
const GROUP_LABELS = {
  High: 'High',
  Medium: 'Medium',
  Low: 'Low',
  _other: 'Other',
}

function getPriorityGroup(idea) {
  const p = str(field(idea, 'Priority', 'Priority'))
  if (PRIORITY_ORDER.includes(p)) return p
  return '_other'
}

function DiscoveryCardClickable({ idea, onClick }) {
  const name = str(field(idea, 'Idea Name', 'Idea Name')) || '(untitled)'
  const description = str(field(idea, 'Idea Description', 'Idea Description')) || ''
  const priority = str(field(idea, 'Priority', 'Priority'))
  const status = str(field(idea, 'Status', 'Status'))
  const statusLabel = getStatusLabel(status)
  const category = str(field(idea, 'Category', 'Category'))
  const dateAdded = dateStr(field(idea, 'Date Added', 'Date Added'))

  return (
    <button type="button" onClick={() => onClick?.(idea)} className="block w-full text-left">
      <Card
        title={name}
        icon={<IconMagicBall size={20} />}
        className={status === 'Archived' ? 'opacity-75' : ''}
      >
        {description && (
          <p className="text-sm text-text-muted line-clamp-2 mb-2">{description}</p>
        )}
        <div className="flex flex-wrap items-center gap-2">
          {statusLabel && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-border text-text-muted">
              {statusLabel}
            </span>
          )}
          {priority && (
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getPriorityTagClass(priority)}`}>
              {priority}
            </span>
          )}
          {category && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-border text-text-muted">
              {category}
            </span>
          )}
          {dateAdded && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-border text-text-muted">
              {dateAdded}
            </span>
          )}
        </div>
      </Card>
    </button>
  )
}

export function DiscoveryList() {
  const { fetchApi, invalidateCache } = usePlannerApi()
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [statusFilter, setStatusFilter] = useState('_open')
  const [categoryFilter, setCategoryFilter] = useState([])
  const [priorityFilter, setPriorityFilter] = useState([])
  const [search, setSearch] = useState('')
  const [modalIdea, setModalIdea] = useState(null)
  const [createOpen, setCreateOpen] = useState(false)

  const refetch = useCallback(() => {
    setLoading(true)
    setError(null)
    return fetchApi('/api/discovery')
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
    invalidateCache()
    refetch()
  }, [invalidateCache, refetch])

  useEffect(() => {
    refetch()
  }, [refetch])

  const handleIdeaUpdate = useCallback(async (ideaId, fields) => {
    try {
      await fetchApi(`/api/discovery/${ideaId}`, {
        method: 'PATCH',
        body: JSON.stringify(fields),
      })
      await refetch()
    } catch (err) {
      console.error(err)
    }
  }, [fetchApi, refetch])

  const handleIdeaDelete = useCallback(async (ideaId) => {
    try {
      await fetchApi(`/api/discovery/${ideaId}`, { method: 'DELETE' })
      await refetch()
      setModalIdea((current) => (current?.id === ideaId ? null : current))
    } catch (err) {
      console.error(err)
    }
  }, [fetchApi, refetch])

  const handleCreateIdea = useCallback(
    async (fields) => {
      await fetchApi('/api/discovery', { method: 'POST', body: JSON.stringify(fields) })
      await refetch()
    },
    [fetchApi, refetch]
  )

  const getStatus = (i) => str(field(i, 'Status', 'Status'))
  const getCategory = (i) => str(field(i, 'Category', 'Category')) || ''
  const getPriority = (i) => str(field(i, 'Priority', 'Priority'))
  const getSearchFields = (i) => ({
    name: str(field(i, 'Idea Name', 'Idea Name')) || '',
    description: str(field(i, 'Idea Description', 'Idea Description')) || '',
    category: getCategory(i),
  })
  const categoryOptions = useMemo(() => {
    const set = new Set()
    list.forEach((i) => {
      const c = getCategory(i)
      if (c) set.add(c)
    })
    return Array.from(set).sort().map((c) => ({ value: c, label: c }))
  }, [list])
  let filtered = filterByStatus(list, statusFilter, getStatus)
  if (categoryFilter.length > 0) filtered = filtered.filter((i) => categoryFilter.includes(getCategory(i)))
  if (priorityFilter.length > 0) filtered = filtered.filter((i) => priorityFilter.includes(getPriority(i)))
  filtered = filterBySearch(filtered, search, getSearchFields)

  const groupBy = getPriorityGroup
  const initialCollapsed = { High: false, Medium: false, Low: false, _other: false }

  const renderItem = (idea) => (
    <DiscoveryCardClickable key={idea.id} idea={idea} onClick={setModalIdea} />
  )

  if (loading && list.length === 0) return <div className="flex justify-center py-12"><Spinner size="lg" /></div>
  if (error && list.length === 0) return <p className="text-red-600 dark:text-red-400">{error}</p>

  return (
    <div className="space-y-6">
      <PageHeader breadcrumbs={[{ label: 'Planner', to: '/' }, { label: 'Discovery', to: '/discovery' }]} onRefresh={handleRefresh} loading={loading} />

      <div className="relative">
        <IconSearch
          size={20}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
        />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search ideas…"
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-surface text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary"
          aria-label="Search discovery ideas"
        />
      </div>

      <FilterBar>
        <FilterDropdown
          label="Status"
          summary={STATUS_OPTIONS.find((o) => o.value === statusFilter)?.label ?? 'Status'}
          options={STATUS_OPTIONS}
          value={statusFilter}
          onChange={setStatusFilter}
        />
        <FilterDropdown
          label="Category"
          summary={categoryFilter.length === 0 ? 'All categories' : categoryFilter.length === 1 ? categoryFilter[0] : `${categoryFilter.length} selected`}
          options={categoryOptions}
          value={categoryFilter}
          onChange={setCategoryFilter}
          multi
          allOptionLabel="All categories"
        />
        <FilterDropdown
          label="Priority"
          summary={priorityFilter.length === 0 ? 'All priorities' : priorityFilter.map((v) => PRIORITY_OPTIONS.find((o) => o.value === v)?.label).join(', ')}
          options={PRIORITY_OPTIONS}
          value={priorityFilter}
          onChange={setPriorityFilter}
          multi
          allOptionLabel="All priorities"
        />
      </FilterBar>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-text">Discovery</h2>
        <p className="text-sm text-text-muted">({filtered.length} ideas)</p>
      </section>

      <CardList
        items={filtered}
        groupBy={groupBy}
        groupOrder={GROUP_ORDER}
        groupLabels={GROUP_LABELS}
        renderItem={renderItem}
        initialCollapsed={initialCollapsed}
      />

      {filtered.length === 0 && (
        <p className="text-text-muted">No ideas for this filter.</p>
      )}

      {modalIdea && (
        <DiscoveryModal
          idea={list.find((i) => i.id === modalIdea.id) || modalIdea}
          onClose={() => setModalIdea(null)}
          onIdeaUpdate={handleIdeaUpdate}
          onIdeaDelete={handleIdeaDelete}
          refetch={refetch}
        />
      )}

      {createOpen && (
        <DiscoveryModal
          idea={null}
          onClose={() => setCreateOpen(false)}
          onCreate={handleCreateIdea}
          refetch={refetch}
        />
      )}

      <Fab onClick={() => setCreateOpen(true)} ariaLabel="Create idea" />
    </div>
  )
}
