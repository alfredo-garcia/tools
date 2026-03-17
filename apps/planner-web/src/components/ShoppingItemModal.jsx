import { useState, useEffect } from 'react'
import { Modal } from '@tools/shared'
import { usePlannerApi } from '../contexts/PlannerApiContext'

const CREATE_ITEM = `
  mutation CreateShoppingItem($input: ShoppingItemCreateInput!) {
    createShoppingItem(input: $input) { id name status }
  }
`
const UPDATE_ITEM = `
  mutation UpdateShoppingItem($id: ID!, $input: ShoppingItemUpdateInput!) {
    updateShoppingItem(id: $id, input: $input) { id name status }
  }
`

export const SHOPPING_CATEGORY_OPTIONS = [
  'Fruits & Vegs',
  'Meat & Fish',
  'Frozen',
  'Drinks',
  'Snacks',
  'Household',
  'Other',
]
const PRIORITY_OPTIONS = ['High', 'Medium', 'Low']
const UNIT_OPTIONS = ['pcs', 'kg', 'L', 'pack', 'bag']

/**
 * Modal to create or edit a shopping item.
 */
export function ShoppingItemModal({ item, onClose, onSaved }) {
  const { graphql } = usePlannerApi()
  const isCreate = item == null

  const [name, setName] = useState('')
  const [nameES, setNameES] = useState('')
  const [category, setCategory] = useState('')
  const [description, setDescription] = useState('')
  const [store, setStore] = useState('')
  const [priority, setPriority] = useState('')
  const [status, setStatus] = useState('Need')
  const [quantity, setQuantity] = useState('')
  const [unit, setUnit] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (item) {
      setName(item.name || '')
      setNameES(item.nameES || '')
      setCategory(item.category || '')
      setDescription(item.description || '')
      setStore(item.store || '')
      setPriority(item.priority || '')
      setStatus(item.status || 'Need')
      setQuantity(item.quantity != null ? String(item.quantity) : '')
      setUnit(item.unit || '')
      setNotes(item.notes || '')
    } else {
      setName('')
      setNameES('')
      setCategory('')
      setDescription('')
      setStore('')
      setPriority('')
      setStatus('Need')
      setQuantity('')
      setUnit('')
      setNotes('')
    }
  }, [item?.id, isCreate])

  const handleSave = async () => {
    setSaving(true)
    try {
      const input = {
        name: (name || '').trim() || undefined,
        nameES: (nameES || '').trim() || undefined,
        category: (category || '').trim() || undefined,
        description: (description || '').trim() || undefined,
        store: (store || '').trim() || undefined,
        priority: (priority || '').trim() || undefined,
        status: (status || '').trim() || undefined,
        quantity: quantity === '' ? undefined : parseFloat(quantity),
        unit: (unit || '').trim() || undefined,
        notes: (notes || '').trim() || undefined,
      }
      if (isCreate) {
        await graphql(CREATE_ITEM, { input })
      } else {
        await graphql(UPDATE_ITEM, { id: item.id, input })
      }
      onSaved?.()
      onClose?.()
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={true}
      onClose={onClose}
      title={isCreate ? 'Add shopping item' : 'Edit shopping item'}
      ariaLabelledBy="shopping-item-modal-title"
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-text-muted mb-1">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name"
            className="w-full rounded-lg border border-border bg-surface text-text px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-text-muted mb-1">Name (ES)</label>
          <input
            type="text"
            value={nameES}
            onChange={(e) => setNameES(e.target.value)}
            placeholder="Name (Spanish)"
            className="w-full rounded-lg border border-border bg-surface text-text px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-text-muted mb-1">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full rounded border border-border bg-surface text-text px-3 py-2"
          >
            <option value="">—</option>
            {SHOPPING_CATEGORY_OPTIONS.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-text-muted mb-1">Store</label>
          <input
            type="text"
            value={store}
            onChange={(e) => setStore(e.target.value)}
            placeholder="Store"
            className="w-full rounded-lg border border-border bg-surface text-text px-3 py-2"
          />
        </div>
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">Priority</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="rounded border border-border bg-surface text-text px-2 py-1 text-sm"
            >
              <option value="">—</option>
              {PRIORITY_OPTIONS.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="rounded border border-border bg-surface text-text px-2 py-1 text-sm"
            >
              <option value="Need">Need</option>
              <option value="Have">Have</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">Quantity</label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="0"
              className="rounded border border-border bg-surface text-text px-2 py-1 text-sm w-24"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">Unit</label>
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="rounded border border-border bg-surface text-text px-2 py-1 text-sm"
            >
              <option value="">—</option>
              {UNIT_OPTIONS.map((u) => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-text-muted mb-1">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description"
            className="w-full rounded-lg border border-border bg-surface text-text px-3 py-2 min-h-[60px] resize-y"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-text-muted mb-1">Notes</label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notes"
            className="w-full rounded-lg border border-border bg-surface text-text px-3 py-2"
          />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-border text-text hover:bg-border"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary/90 disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
