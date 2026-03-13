import { useState, useEffect } from 'react'
import { IconX } from '@tools/shared'
import { usePlannerApi } from '../contexts/PlannerApiContext'
import { field, str } from '@tools/shared'

const PRIORITY_OPTIONS = ['High', 'Medium', 'Low']
/** Categorías fijas del campo Category en Airtable (Single select). Exportado para el filtro en ShoppingPage. */
export const SHOPPING_CATEGORY_OPTIONS = ['Fruits & Vegs', 'Meat & Fish', 'Frozen', 'Drinks', 'Snacks', 'Household', 'Other']
/** Unidades fijas del campo Unit en Airtable (Single select). */
const UNIT_OPTIONS = ['pcs', 'kg', 'L', 'pack', 'bag']

const INITIAL_FORM = {
  Name: '',
  Category: '',
  Description: '',
  'Image (Web)': '',
  'Name ES': '',
  Notes: '',
  Priority: '',
  Quantity: '',
  Status: 'Need',
  Store: '',
  Unit: '',
}

/**
 * Modal de edición o creación de un item de la Shopping List (Airtable).
 * Si item es null y onCreate está definido, muestra formulario de creación (POST).
 * Campos: Name, Category, Description, Image (Web), Name ES, Notes, Priority, Quantity, Status, Store, Unit.
 * @param {string[]} [existingStores] - Optional list of Store values from other items for the Store dropdown suggestions.
 */
export function ShoppingItemModal({ item, onClose, onItemUpdate, refetch, onCreate, existingStores = [] }) {
  const { fetchApi } = usePlannerApi()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(INITIAL_FORM)
  const isCreate = item == null && onCreate

  useEffect(() => {
    if (item) {
      setForm({
        Name: str(field(item, 'Name')) || '',
        Category: str(field(item, 'Category')) || '',
        Description: str(field(item, 'Description')) || '',
        'Image (Web)': str(field(item, 'Image (Web)')) || '',
        'Name ES': str(field(item, 'Name ES')) || '',
        Notes: str(field(item, 'Notes')) || '',
        Priority: str(field(item, 'Priority')) || '',
        Quantity: item.Quantity != null && item.Quantity !== '' ? String(item.Quantity) : '',
        Status: str(field(item, 'Status')) || 'Need',
        Store: str(field(item, 'Store')) || '',
        Unit: str(field(item, 'Unit')) || '',
      })
    } else if (isCreate) {
      setForm(INITIAL_FORM)
    }
  }, [item, isCreate])

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const buildPayload = () => ({
    Name: form.Name.trim() || undefined,
    Category: form.Category.trim() || undefined,
    Description: form.Description.trim() || undefined,
    'Image (Web)': form['Image (Web)'].trim() || undefined,
    'Name ES': form['Name ES'].trim() || undefined,
    Notes: form.Notes.trim() || undefined,
    Priority: form.Priority.trim() || undefined,
    Quantity: form.Quantity === '' ? undefined : (Number(form.Quantity) || 0),
    Status: form.Status.trim() || undefined,
    Store: form.Store.trim() || undefined,
    Unit: form.Unit.trim() || undefined,
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (isCreate) {
        const payload = buildPayload()
        await fetchApi('/api/shopping', {
          method: 'POST',
          body: JSON.stringify({ ...payload, Name: payload.Name || '(untitled)' }),
        })
        await refetch?.()
        onCreate?.()
        onClose()
      } else if (item) {
        const payload = buildPayload()
        await fetchApi(`/api/shopping/${item.id}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        })
        await refetch?.()
        onItemUpdate?.()
        onClose()
      }
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  if (!item && !onCreate) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="shopping-modal-title"
    >
      <div
        className="bg-surface rounded-2xl border-2 border-border shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-border flex items-center justify-between gap-3">
          <h2 id="shopping-modal-title" className="font-bold text-xl text-text truncate flex-1">
            {isCreate ? 'New item' : 'Edit item'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 p-2 rounded-lg text-text-muted hover:bg-border text-xl leading-none"
            aria-label="Close"
          >
            <IconX size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 overflow-y-auto flex-1 space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-muted mb-1.5">Name</label>
            <input
              type="text"
              value={form.Name}
              onChange={(e) => handleChange('Name', e.target.value)}
              className="w-full rounded-lg border border-border bg-surface text-text px-3 py-2.5"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-muted mb-1.5">Store</label>
            <input
              type="text"
              list="shopping-store-list"
              value={form.Store}
              onChange={(e) => handleChange('Store', e.target.value)}
              placeholder="Where you find it"
              className="w-full rounded-lg border border-border bg-surface text-text px-3 py-2.5"
              autoComplete="off"
            />
            {existingStores.length > 0 && (
              <datalist id="shopping-store-list">
                {existingStores.map((store) => (
                  <option key={store} value={store} />
                ))}
              </datalist>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-text-muted mb-1.5">Priority</label>
            <select
              value={form.Priority}
              onChange={(e) => handleChange('Priority', e.target.value)}
              className="w-full rounded-lg border border-border bg-surface text-text px-3 py-2.5"
            >
              <option value="">—</option>
              {PRIORITY_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-muted mb-1.5">Category</label>
            <select
              value={form.Category}
              onChange={(e) => handleChange('Category', e.target.value)}
              className="w-full rounded-lg border border-border bg-surface text-text px-3 py-2.5"
            >
              <option value="">—</option>
              {SHOPPING_CATEGORY_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-muted mb-1.5">Status</label>
            <select
              value={form.Status}
              onChange={(e) => handleChange('Status', e.target.value)}
              className="w-full rounded-lg border border-border bg-surface text-text px-3 py-2.5"
            >
              <option value="Need">Need</option>
              <option value="Have">Have</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-muted mb-1.5">Quantity</label>
            <input
              type="number"
              min="0"
              step={form.Unit === 'kg' || form.Unit === 'L' ? 'any' : '1'}
              value={form.Quantity}
              onChange={(e) => handleChange('Quantity', e.target.value)}
              className="w-full rounded-lg border border-border bg-surface text-text px-3 py-2.5"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-muted mb-1.5">Unit</label>
            <select
              value={form.Unit}
              onChange={(e) => handleChange('Unit', e.target.value)}
              className="w-full rounded-lg border border-border bg-surface text-text px-3 py-2.5"
            >
              <option value="">—</option>
              {UNIT_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-muted mb-1.5">Description</label>
            <textarea
              value={form.Description}
              onChange={(e) => handleChange('Description', e.target.value)}
              className="w-full rounded-lg border border-border bg-surface text-text px-3 py-2.5 min-h-[80px] resize-y"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-muted mb-1.5">Name ES</label>
            <input
              type="text"
              value={form['Name ES']}
              onChange={(e) => handleChange('Name ES', e.target.value)}
              className="w-full rounded-lg border border-border bg-surface text-text px-3 py-2.5"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-muted mb-1.5">Image (Web)</label>
            <input
              type="url"
              value={form['Image (Web)']}
              onChange={(e) => handleChange('Image (Web)', e.target.value)}
              placeholder="https://..."
              className="w-full rounded-lg border border-border bg-surface text-text px-3 py-2.5"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-muted mb-1.5">Notes</label>
            <textarea
              value={form.Notes}
              onChange={(e) => handleChange('Notes', e.target.value)}
              className="w-full rounded-lg border border-border bg-surface text-text px-3 py-2.5 min-h-[80px] resize-y"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] px-4 rounded-xl text-sm font-medium bg-border text-text hover:bg-border/80"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="min-h-[44px] px-6 rounded-xl text-sm font-medium bg-primary text-white hover:bg-primary/90 disabled:opacity-50"
            >
              {saving ? 'Saving…' : isCreate ? 'Create' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
