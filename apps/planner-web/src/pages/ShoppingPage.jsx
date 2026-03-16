import { useState, useEffect, useCallback } from 'react'
import {
  Spinner,
  PageHeader,
  EntityListPage,
  CardList,
  Card,
  IconCart,
  IconCheckSquare,
  IconCircle,
  FilterBar,
  FilterDropdown,
} from '@tools/shared'
import { usePlannerApi } from '../contexts/PlannerApiContext'

const SHOPPING_QUERY = `
  query { shopping { id name nameES category store priority status quantity unit lastModified } }
`

const UPDATE_STATUS_MUTATION = `
  mutation UpdateStatus($id: ID!, $input: ShoppingItemUpdateInput!) {
    updateShoppingItem(id: $id, input: $input) { id status }
  }
`

const STATUS_OPTIONS = [
  { value: 'Need', label: 'Needs' },
  { value: 'Have', label: 'Have' },
  { value: '', label: 'All statuses' },
]

function ShoppingCard({ item, onToggleStatus }) {
  const title = [item.name, item.nameES].filter(Boolean).join(' — ') || '(untitled)'
  const isHave = item.status === 'Have'

  const handleCheckbox = async (e) => {
    e.stopPropagation()
    const newStatus = isHave ? 'Need' : 'Have'
    try {
      await onToggleStatus(item.id, newStatus)
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <Card title={title} icon={<IconCart size={20} />}>
      <div className="flex items-center gap-3 mt-2">
        <button
          type="button"
          onClick={handleCheckbox}
          className="shrink-0 p-1 rounded-lg hover:bg-border text-text-muted hover:text-text"
          aria-label={isHave ? 'Mark as need' : 'Mark as have'}
        >
          {isHave ? (
            <IconCheckSquare size={22} className="text-status-done" />
          ) : (
            <IconCircle size={22} strokeWidth={2} />
          )}
        </button>
        <div className="flex flex-wrap gap-2 text-sm text-text-muted">
          {item.category && <span>{item.category}</span>}
          {item.store && <span>{item.store}</span>}
          {item.priority && (
            <span className="px-2 py-0.5 rounded bg-border">{item.priority}</span>
          )}
        </div>
      </div>
    </Card>
  )
}

export function ShoppingPage() {
  const { graphql } = usePlannerApi()
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [statusFilter, setStatusFilter] = useState('Need')

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await graphql(SHOPPING_QUERY)
      setList(data?.shopping ?? [])
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [graphql])

  useEffect(() => {
    load()
  }, [load])

  const updateStatus = useCallback(
    async (id, status) => {
      await graphql(UPDATE_STATUS_MUTATION, {
        id,
        input: { status },
      })
      setList((prev) => prev.map((i) => (i.id === id ? { ...i, status } : i)))
    },
    [graphql]
  )

  const filtered =
    statusFilter === ''
      ? list
      : list.filter((i) => (i.status || 'Need') === statusFilter)

  const statusSummary = statusFilter ? STATUS_OPTIONS.find((o) => o.value === statusFilter)?.label : 'All statuses'

  return (
    <EntityListPage
      header={<PageHeader title="Shopping" onRefresh={load} loading={loading} />}
      filters={
        <FilterBar>
          <FilterDropdown
            label="Status"
            summary={statusSummary}
            options={STATUS_OPTIONS}
            value={statusFilter}
            onChange={setStatusFilter}
          />
        </FilterBar>
      }
      showEmptyState={!loading && filtered.length === 0}
      emptyState={
        <p className="text-text-muted text-center py-8">
          {list.length === 0 ? 'No shopping items yet.' : 'No items match the filter.'}
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
          {filtered.map((item) => (
            <ShoppingCard key={item.id} item={item} onToggleStatus={updateStatus} />
          ))}
        </CardList>
      )}
    </EntityListPage>
  )
}
