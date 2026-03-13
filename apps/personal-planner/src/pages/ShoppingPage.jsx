import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Spinner,
  PageHeader,
  Fab,
  IconFilter,
  IconChevronDown,
  IconChevronUp,
  IconSearch,
  IconCheckSquare,
  IconCircle,
  IconUtensils,
  IconChickenLeg,
  IconBottle,
  IconTapa,
  IconCake,
  IconTag,
  IconCart,
  field,
  str,
} from '@tools/shared'
import { usePlannerApi } from '../contexts/PlannerApiContext'
import { getPriorityTagClass } from '../components/TaskCard'
import { ShoppingItemModal, SHOPPING_CATEGORY_OPTIONS } from '../components/ShoppingItemModal'

const STATUS_FILTER_OPTIONS = [
  { value: 'Need', label: 'Needs', aria: 'Show items you need' },
  { value: 'Have', label: 'Have', aria: 'Show items you have' },
  { value: '', label: 'All', aria: 'Show all items' },
]
const PRIORITY_FILTER_OPTIONS = [
  { value: 'High', label: 'High' },
  { value: 'Medium', label: 'Medium' },
  { value: 'Low', label: 'Low' },
  { value: '', label: 'All' },
]
const FILTERS_STORAGE_KEY = 'mosco-shopping-filters-collapsed'

/** Icono por categoría de item (tipo de comida). Usa iconos existentes de shared. */
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

function readFiltersCollapsed() {
  if (typeof window === 'undefined') return true
  try {
    const stored = localStorage.getItem(FILTERS_STORAGE_KEY)
    if (stored === null) return true
    return JSON.parse(stored)
  } catch {
    return true
  }
}
function writeFiltersCollapsed(collapsed) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(FILTERS_STORAGE_KEY, JSON.stringify(collapsed))
  } catch {}
}

function ShoppingMiniCard({ item, onToggleStatus, onOpenModal }) {
  const nameES = str(field(item, 'Name ES')) || ''
  const name = str(field(item, 'Name')) || ''
  const title =
    name && nameES ? `${name} - ${nameES}` : name || nameES || '(untitled)'
  const category = str(field(item, 'Category')) || ''
  const store = str(field(item, 'Store')) || ''
  const priority = str(field(item, 'Priority')) || ''
  const status = str(field(item, 'Status')) || 'Need'
  const isHave = status === 'Have'
  const CategoryIcon = getCategoryIcon(category)

  const handleCheckbox = async (e) => {
    e.stopPropagation()
    const newStatus = isHave ? 'Need' : 'Have'
    try {
      await onToggleStatus(item.id, newStatus)
    } catch (err) {
      console.error(err)
    }
  }

  const handleCardClick = () => onOpenModal?.(item)
  const handleCardKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleCardClick()
    }
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleCardClick}
      onKeyDown={handleCardKeyDown}
      className="w-full text-left rounded-xl bg-surface border border-border hover:border-primary/40 transition-colors overflow-hidden cursor-pointer"
    >
      <div className="p-4 flex items-start gap-3">
        <button
          type="button"
          onClick={handleCheckbox}
          className="shrink-0 mt-0.5 p-1 rounded-lg hover:bg-border text-text-muted hover:text-text focus:outline-none focus:ring-2 focus:ring-primary"
          aria-label={isHave ? 'Mark as need' : 'Mark as have'}
          title={isHave ? 'Mark as need' : 'Mark as have'}
        >
          {isHave ? (
            <IconCheckSquare size={22} className="text-status-done" aria-hidden />
          ) : (
            <IconCircle size={22} strokeWidth={2} aria-hidden />
          )}
        </button>
        <div className="shrink-0 mt-0.5 text-text-muted" aria-hidden>
          <CategoryIcon size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="font-semibold text-text min-w-0">
              {title}
            </div>
            {priority && (
              <span
                className={`shrink-0 inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium ${getPriorityTagClass(priority)}`}
              >
                {priority}
              </span>
            )}
          </div>
          <div className="text-sm text-text-muted mt-1 space-y-0.5">
            {category && <div>{category}</div>}
            {store && <div>{store}</div>}
          </div>
        </div>
      </div>
    </div>
  )
}

export function ShoppingPage() {
  const { fetchApi, invalidateCache } = usePlannerApi()
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('Need')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [storeFilter, setStoreFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [filtersCollapsed, setFiltersCollapsed] = useState(readFiltersCollapsed)
  const [modalItem, setModalItem] = useState(null)
  const [createOpen, setCreateOpen] = useState(false)

  const refetch = useCallback(() => {
    setLoading(true)
    setError(null)
    return fetchApi('/api/shopping')
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
    invalidateCache('/api/shopping')
    refetch()
  }, [invalidateCache, refetch])

  useEffect(() => {
    refetch()
  }, [refetch])

  const toggleFiltersCollapsed = useCallback(() => {
    setFiltersCollapsed((prev) => {
      const next = !prev
      writeFiltersCollapsed(next)
      return next
    })
  }, [])

  const uniqueStores = useMemo(() => {
    const set = new Set()
    list.forEach((i) => {
      const s = str(field(i, 'Store'))
      if (s) set.add(s)
    })
    return Array.from(set).sort()
  }, [list])

  const handleToggleStatus = useCallback(
    async (itemId, newStatus) => {
      await fetchApi(`/api/shopping/${itemId}`, {
        method: 'PATCH',
        body: JSON.stringify({ Status: newStatus }),
      })
      invalidateCache('/api/shopping')
      setList((prev) =>
        prev.map((i) => (i.id === itemId ? { ...i, Status: newStatus } : i))
      )
    },
    [fetchApi, invalidateCache]
  )

  let filtered = list
  const searchLower = search.trim().toLowerCase()
  if (searchLower) {
    filtered = filtered.filter((i) => {
      const name = (str(field(i, 'Name')) || '').toLowerCase()
      const store = (str(field(i, 'Store')) || '').toLowerCase()
      const cat = (str(field(i, 'Category')) || '').toLowerCase()
      const desc = (str(field(i, 'Description')) || '').toLowerCase()
      return (
        name.includes(searchLower) ||
        store.includes(searchLower) ||
        cat.includes(searchLower) ||
        desc.includes(searchLower)
      )
    })
  }
  if (statusFilter) {
    filtered = filtered.filter((i) => str(field(i, 'Status')) === statusFilter)
  }
  if (priorityFilter) {
    filtered = filtered.filter((i) => str(field(i, 'Priority')) === priorityFilter)
  }
  if (storeFilter) {
    filtered = filtered.filter((i) => str(field(i, 'Store')) === storeFilter)
  }
  if (categoryFilter) {
    filtered = filtered.filter((i) => str(field(i, 'Category')) === categoryFilter)
  }

  return (
    <div className="app-content">
      <PageHeader
        title="Shopping"
        breadcrumbs={[{ label: 'Shopping', to: '/shopping' }]}
        onRefresh={handleRefresh}
        loading={loading}
      />
      <div className="space-y-4">
        <div className="relative">
          <IconSearch
            size={20}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
          />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search items…"
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-surface text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary"
            aria-label="Search shopping list"
          />
        </div>

        <div className="rounded-xl bg-surface overflow-hidden border border-border">
          <button
            type="button"
            onClick={toggleFiltersCollapsed}
            className="w-full p-4 flex items-center justify-between gap-3 text-left hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            aria-expanded={!filtersCollapsed}
          >
            <div className="flex items-center gap-3">
              <IconFilter size={20} className="text-text-muted shrink-0" />
              <span className="font-semibold text-text">Filters</span>
            </div>
            {filtersCollapsed ? (
              <IconChevronDown size={20} className="text-text-muted shrink-0" />
            ) : (
              <IconChevronUp size={20} className="text-text-muted shrink-0" />
            )}
          </button>
          {!filtersCollapsed && (
            <div className="px-4 pb-4 pt-0 space-y-4 border-t border-border">
              {/* Desktop: row1 = Status + Priority. Mobile: each on its own row */}
              <div className="flex flex-col md:flex-row md:items-start gap-4 md:gap-8">
                <div className="min-w-0">
                  <span className="text-text-muted text-xs font-medium uppercase tracking-wide">Status</span>
                  <div className="flex flex-wrap gap-2 mt-1.5">
                    {STATUS_FILTER_OPTIONS.map(({ value, label, aria }) => (
                      <button
                        key={value || 'all'}
                        type="button"
                        onClick={() => setStatusFilter(value)}
                        aria-label={aria}
                        className={`min-h-[36px] px-3 rounded-xl text-sm font-medium ${
                          statusFilter === value
                            ? 'bg-primary text-white'
                            : 'bg-border text-text hover:bg-border/80'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="min-w-0">
                  <span className="text-text-muted text-xs font-medium uppercase tracking-wide">Priority</span>
                  <div className="flex flex-wrap gap-2 mt-1.5">
                    {PRIORITY_FILTER_OPTIONS.map(({ value, label }) => (
                      <button
                        key={value || 'all'}
                        type="button"
                        onClick={() => setPriorityFilter(value)}
                        className={`min-h-[36px] px-3 rounded-xl text-sm font-medium ${
                          priorityFilter === value
                            ? 'bg-primary text-white'
                            : 'bg-border text-text hover:bg-border/80'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              {/* Row 2: Store (buttons) */}
              <div>
                <span className="text-text-muted text-xs font-medium uppercase tracking-wide">Store</span>
                <div className="flex flex-wrap gap-2 mt-1.5">
                  <button
                    type="button"
                    onClick={() => setStoreFilter('')}
                    className={`min-h-[36px] px-3 rounded-xl text-sm font-medium ${
                      storeFilter === ''
                        ? 'bg-primary text-white'
                        : 'bg-border text-text hover:bg-border/80'
                    }`}
                  >
                    All
                  </button>
                  {uniqueStores.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setStoreFilter(s)}
                      className={`min-h-[36px] px-3 rounded-xl text-sm font-medium ${
                        storeFilter === s
                          ? 'bg-primary text-white'
                          : 'bg-border text-text hover:bg-border/80'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              {/* Row 3: Category (buttons) */}
              <div>
                <span className="text-text-muted text-xs font-medium uppercase tracking-wide">Category</span>
                <div className="flex flex-wrap gap-2 mt-1.5">
                  <button
                    type="button"
                    onClick={() => setCategoryFilter('')}
                    className={`min-h-[36px] px-3 rounded-xl text-sm font-medium ${
                      categoryFilter === ''
                        ? 'bg-primary text-white'
                        : 'bg-border text-text hover:bg-border/80'
                    }`}
                  >
                    All
                  </button>
                  {SHOPPING_CATEGORY_OPTIONS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCategoryFilter(c)}
                      className={`min-h-[36px] px-3 rounded-xl text-sm font-medium ${
                        categoryFilter === c
                          ? 'bg-primary text-white'
                          : 'bg-border text-text hover:bg-border/80'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {loading && (
          <div className="flex justify-center py-8">
            <Spinner />
          </div>
        )}
        {error && (
          <p className="text-red-600 dark:text-red-400 text-sm py-4">{error}</p>
        )}
        {!loading && !error && (
          <div className="grid gap-3">
            {filtered.length === 0 ? (
              <p className="text-text-muted text-sm py-6 text-center">
                No items match your filters. Try changing filters or search.
              </p>
            ) : (
              filtered.map((item) => (
                <ShoppingMiniCard
                  key={item.id}
                  item={item}
                  onToggleStatus={handleToggleStatus}
                  onOpenModal={setModalItem}
                />
              ))
            )}
          </div>
        )}
      </div>

      {modalItem && (
        <ShoppingItemModal
          item={modalItem}
          onClose={() => setModalItem(null)}
          onItemUpdate={() => setModalItem(null)}
          refetch={refetch}
          existingStores={uniqueStores}
        />
      )}
      {createOpen && (
        <ShoppingItemModal
          item={null}
          onClose={() => setCreateOpen(false)}
          refetch={refetch}
          onCreate={() => setCreateOpen(false)}
          existingStores={uniqueStores}
        />
      )}
      <Fab onClick={() => setCreateOpen(true)} ariaLabel="Add shopping item" />
    </div>
  )
}
