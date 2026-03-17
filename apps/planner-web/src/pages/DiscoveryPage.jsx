import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Spinner,
  PageHeader,
  Card,
  CardList,
  EntityListPage,
  IconMagicBall,
  IconSearch,
  FilterBar,
  FilterDropdown,
} from '@tools/shared'
import { usePlannerApi } from '../contexts/PlannerApiContext'

const DISCOVERY_QUERY = `
  query {
    discovery {
      id
      ideaName
      ideaDescription
      category
      status
      priority
      dateAdded
      objectives
      lastModified
    }
  }
`

const CREATE_MUTATION = `
  mutation CreateDiscoveryIdea($input: DiscoveryIdeaCreateInput!) {
    createDiscoveryIdea(input: $input) {
      id
      ideaName
      ideaDescription
      category
      status
      priority
      dateAdded
      lastModified
    }
  }
`

const UPDATE_MUTATION = `
  mutation UpdateDiscoveryIdea($id: ID!, $input: DiscoveryIdeaUpdateInput!) {
    updateDiscoveryIdea(id: $id, input: $input) {
      id
      ideaName
      ideaDescription
      category
      status
      priority
      dateAdded
      lastModified
    }
  }
`

const DELETE_MUTATION = `
  mutation DeleteDiscoveryIdea($id: ID!) {
    deleteDiscoveryIdea(id: $id)
  }
`

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: '_open', label: 'All open' },
  { value: 'New', label: 'Parking lot' },
  { value: 'Under Review', label: 'Discovery' },
  { value: 'Explored', label: 'Done' },
  { value: 'Archived', label: 'Archived' },
]

function getStatusLabel(value) {
  const opt = STATUS_OPTIONS.find((o) => o.value === value)
  return opt ? opt.label : value || ''
}

function filterByStatus(list, statusFilter) {
  if (!list?.length) return list
  if (statusFilter === '_open') return list.filter((i) => (i.status || '') !== 'Archived')
  if (statusFilter === '') return list
  return list.filter((i) => (i.status || '') === statusFilter)
}

function filterBySearch(list, searchQuery) {
  if (!searchQuery?.trim()) return list
  const q = searchQuery.trim().toLowerCase()
  return list.filter((i) => {
    const name = (i.ideaName || '').toLowerCase()
    const desc = (i.ideaDescription || '').toLowerCase()
    const cat = (i.category || '').toLowerCase()
    return name.includes(q) || desc.includes(q) || cat.includes(q)
  })
}

function DiscoveryCard({ idea, onDelete, onUpdateStatus }) {
  const statusLabel = getStatusLabel(idea.status)
  const handleDelete = (e) => {
    e.stopPropagation()
    if (typeof onDelete === 'function') onDelete(idea.id)
  }

  return (
    <Card
      title={idea.ideaName || '(untitled)'}
      icon={<IconMagicBall size={20} />}
      className={idea.status === 'Archived' ? 'opacity-75' : ''}
    >
      {idea.ideaDescription && (
        <p className="text-sm text-text-muted line-clamp-2 mb-2">{idea.ideaDescription}</p>
      )}
      <div className="flex flex-wrap items-center gap-2">
        {statusLabel && (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-border text-text-muted">
            {statusLabel}
          </span>
        )}
        {idea.priority && (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary-muted text-primary">
            {idea.priority}
          </span>
        )}
        {idea.category && (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-border text-text-muted">
            {idea.category}
          </span>
        )}
        {idea.dateAdded && (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-border text-text-muted">
            {String(idea.dateAdded).slice(0, 10)}
          </span>
        )}
      </div>
      <div className="flex justify-end gap-2 mt-3 pt-2 border-t border-border">
        {onUpdateStatus && idea.status !== 'Archived' && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onUpdateStatus(idea.id, 'Archived')
            }}
            className="text-xs text-text-muted hover:text-text"
          >
            Archive
          </button>
        )}
        <button
          type="button"
          onClick={handleDelete}
          className="text-xs text-red-600 dark:text-red-400 hover:underline"
          aria-label="Delete idea"
        >
          Delete
        </button>
      </div>
    </Card>
  )
}

export function DiscoveryPage() {
  const { graphql } = usePlannerApi()
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [statusFilter, setStatusFilter] = useState('_open')
  const [search, setSearch] = useState('')
  const [createName, setCreateName] = useState('')
  const [createDescription, setCreateDescription] = useState('')
  const [createStatus, setCreateStatus] = useState('New')
  const [createPriority, setCreatePriority] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await graphql(DISCOVERY_QUERY)
      setList(data?.discovery ?? [])
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
    let out = filterByStatus(list, statusFilter)
    out = filterBySearch(out, search)
    return out
  }, [list, statusFilter, search])

  const statusSummary = useMemo(
    () => STATUS_OPTIONS.find((o) => o.value === statusFilter)?.label ?? 'All statuses',
    [statusFilter]
  )

  const handleCreate = useCallback(
    async (e) => {
      e.preventDefault()
      const name = (createName || '').trim()
      if (!name) return
      setSubmitting(true)
      setError(null)
      try {
        await graphql(CREATE_MUTATION, {
          input: {
            ideaName: name,
            ideaDescription: (createDescription || '').trim() || null,
            status: createStatus || null,
            priority: (createPriority || '').trim() || null,
          },
        })
        setCreateName('')
        setCreateDescription('')
        setCreatePriority('')
        await load()
      } catch (e) {
        setError(e.message)
      } finally {
        setSubmitting(false)
      }
    },
    [graphql, load, createName, createDescription, createStatus, createPriority]
  )

  const handleUpdateStatus = useCallback(
    async (id, status) => {
      try {
        await graphql(UPDATE_MUTATION, { id, input: { status } })
        setList((prev) => prev.map((i) => (i.id === id ? { ...i, status } : i)))
      } catch (e) {
        setError(e.message)
      }
    },
    [graphql]
  )

  const handleDelete = useCallback(
    async (id) => {
      if (!confirm('Delete this idea?')) return
      try {
        await graphql(DELETE_MUTATION, { id })
        setList((prev) => prev.filter((i) => i.id !== id))
      } catch (e) {
        setError(e.message)
      }
    },
    [graphql]
  )

  return (
    <EntityListPage
      header={<PageHeader title="Discovery" onRefresh={load} loading={loading} />}
      filters={
        <div className="space-y-3">
          <div className="relative w-full max-w-md">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" aria-hidden>
              <IconSearch size={18} />
            </span>
            <input
              id="discovery-search"
              type="search"
              placeholder="Name, description, category…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-surface text-text text-sm placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50"
              aria-label="Search discovery ideas"
            />
          </div>
          <FilterBar>
            <FilterDropdown
              label="Status"
              summary={statusSummary}
              options={STATUS_OPTIONS}
              value={statusFilter}
              onChange={setStatusFilter}
            />
          </FilterBar>
        </div>
      }
      showEmptyState={!loading && filtered.length === 0}
      emptyState={
        <p className="text-text-muted text-center py-8">
          {list.length === 0 ? 'No ideas yet. Add one below.' : 'No ideas match the filter.'}
        </p>
      }
    >
      {error && (
        <p className="text-red-600 dark:text-red-400 text-sm mb-4" role="alert">
          {error}
        </p>
      )}

      <form onSubmit={handleCreate} className="mb-6 p-4 rounded-xl border border-border bg-bg-muted/50 space-y-3">
        <h3 className="text-sm font-medium text-text">Add idea</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <input
            type="text"
            placeholder="Idea name *"
            value={createName}
            onChange={(e) => setCreateName(e.target.value)}
            className="rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50"
            required
          />
          <input
            type="text"
            placeholder="Description"
            value={createDescription}
            onChange={(e) => setCreateDescription(e.target.value)}
            className="rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          <select
            value={createStatus}
            onChange={(e) => setCreateStatus(e.target.value)}
            className="rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            {STATUS_OPTIONS.filter((o) => o.value && o.value !== '_open').map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Priority (e.g. High)"
            value={createPriority}
            onChange={(e) => setCreatePriority(e.target.value)}
            className="rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
        <button
          type="submit"
          disabled={submitting || !(createName || '').trim()}
          className="rounded-lg bg-primary text-primary-fg px-4 py-2 text-sm font-medium hover:opacity-90 disabled:opacity-50"
        >
          {submitting ? 'Adding…' : 'Add idea'}
        </button>
      </form>

      {loading && list.length === 0 ? (
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      ) : (
        <CardList>
          {filtered.map((idea) => (
            <DiscoveryCard
              key={idea.id}
              idea={idea}
              onDelete={handleDelete}
              onUpdateStatus={handleUpdateStatus}
            />
          ))}
        </CardList>
      )}
    </EntityListPage>
  )
}
