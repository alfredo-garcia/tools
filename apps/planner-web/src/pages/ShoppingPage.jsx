import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Spinner,
  PageHeader,
  EntityListPage,
  CardList,
  IconCart,
  IconCheckSquare,
  IconCircle,
  IconSearch,
  IconUtensils,
  IconChickenLeg,
  IconCake,
  IconBottle,
  IconTapa,
  IconTag,
  FilterBar,
  FilterDropdown,
  Fab,
} from '@tools/shared'
import { usePlannerApi } from '../contexts/PlannerApiContext'
import { ShoppingItemModal, SHOPPING_CATEGORY_OPTIONS } from '../components/ShoppingItemModal'

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

const CATEGORY_ICON_MAP = {
  'Fruits & Vegs': IconUtensils,
  'Meat & Fish': IconChickenLeg,
  Frozen: IconCake,
  Drinks: IconBottle,
  Snacks: IconTapa,
  Household: IconTag,
  Other: IconTag,
}
const DEFAULT_CATEGORY_ICON = IconCart

function getCategoryIcon(category) {
  if (!category) return DEFAULT_CATEGORY_ICON
  return CATEGORY_ICON_MAP[category] ?? DEFAULT_CATEGORY_ICON
}

function ShoppingCard({ item, onToggleStatus, onOpenModal }) {
  const title = [item.name, item.nameES].filter(Boolean).join(' — ') || '(untitled)'
  const isHave = item.status === 'Have'
  const CategoryIcon = getCategoryIcon(item.category)

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
    <button
      type="button"
      onClick={() => onOpenModal?.(item)}
      className="block w-full text-left rounded-xl bg-surface overflow-hidden"
    >
      <div className="p-4">
        <div className="flex items-center gap-2">
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
          <span className="shrink-0 text-text-muted">
            <CategoryIcon size={20} />
          </span>
          <span className="font-semibold text-text truncate min-w-0">{title}</span>
        </div>
        {item.store && (
          <p className="text-sm text-text-muted mt-1 pl-12">
            {item.store}
          </p>
        )}
      </div>
    </button>
  )
}

export function ShoppingPage() {
  const { graphql } = usePlannerApi()
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [statusFilter, setStatusFilter] = useState('Need')
  const [storeFilter, setStoreFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState([])
  const [search, setSearch] = useState('')
  const [modalItem, setModalItem] = useState(null)
  const [createOpen, setCreateOpen] = useState(false)

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
      await graphql(UPDATE_STATUS_MUTATION, { id, input: { status } })
      setList((prev) => prev.map((i) => (i.id === id ? { ...i, status } : i)))
    },
    [graphql]
  )

  const uniqueStores = useMemo(() => {
    const stores = [...new Set(list.map((i) => i.store).filter(Boolean))].sort()
    return stores.map((s) => ({ value: s, label: s }))
  }, [list])

  const categoryOptions = useMemo(
    () => SHOPPING_CATEGORY_OPTIONS.map((c) => ({ value: c, label: c })),
    []
  )

  const filtered = useMemo(() => {
    let result = list
    if (statusFilter !== '') {
      result = result.filter((i) => (i.status || 'Need') === statusFilter)
    }
    if (storeFilter !== '') {
      result = result.filter((i) => (i.store || '') === storeFilter)
    }
    if (categoryFilter.length > 0) {
      result = result.filter((i) => categoryFilter.includes(i.category || ''))
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      result = result.filter(
        (i) =>
          (i.name || '').toLowerCase().includes(q) ||
          (i.nameES || '').toLowerCase().includes(q) ||
          (i.store || '').toLowerCase().includes(q) ||
          (i.category || '').toLowerCase().includes(q) ||
          (i.description || '').toLowerCase().includes(q)
      )
    }
    return result
  }, [list, statusFilter, storeFilter, categoryFilter, search])

  const statusSummary =
    statusFilter === '' ? 'All statuses' : STATUS_OPTIONS.find((o) => o.value === statusFilter)?.label
  const storeSummary = storeFilter === '' ? 'All stores' : storeFilter
  const categorySummary =
    categoryFilter.length === 0 ? 'All categories' : categoryFilter.slice(0, 2).join(', ') + (categoryFilter.length > 2 ? '…' : '')

  return (
    <EntityListPage
      header={<PageHeader title="Shopping" onRefresh={load} loading={loading} />}
      filters={
        <div className="space-y-3">
          <div className="relative w-full max-w-md">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none">
              <IconSearch size={18} />
            </span>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search…"
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-surface text-text text-sm"
              aria-label="Search shopping list"
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
            {uniqueStores.length > 0 && (
              <FilterDropdown
                label="Store"
                summary={storeSummary}
                options={uniqueStores}
                value={storeFilter}
                onChange={setStoreFilter}
              />
            )}
            <FilterDropdown
              label="Category"
              summary={categorySummary}
              options={categoryOptions}
              value={categoryFilter}
              onChange={setCategoryFilter}
              multi
            />
          </FilterBar>
        </div>
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
            <ShoppingCard
              key={item.id}
              item={item}
              onToggleStatus={updateStatus}
              onOpenModal={setModalItem}
            />
          ))}
        </CardList>
      )}
      <Fab onClick={() => setCreateOpen(true)} ariaLabel="Add shopping item" />
      {createOpen && (
        <ShoppingItemModal item={null} onClose={() => setCreateOpen(false)} onSaved={load} />
      )}
      {modalItem && (
        <ShoppingItemModal
          item={modalItem}
          onClose={() => setModalItem(null)}
          onSaved={load}
        />
      )}
    </EntityListPage>
  )
}
