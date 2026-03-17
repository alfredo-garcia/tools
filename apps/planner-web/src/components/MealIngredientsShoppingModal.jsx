import { useMemo, useState } from 'react'
import { Modal } from '@tools/shared'

function normalizeName(s) {
  return String(s || '').trim().toLowerCase()
}

function StatusPill({ status }) {
  const v = status || ''
  const cls =
    v === 'Have'
      ? 'bg-status-done/15 text-status-done border-status-done/30'
      : v === 'Need'
        ? 'bg-primary/10 text-primary border-primary/30'
        : 'bg-border/40 text-text-muted border-border'
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${cls}`}>
      {v || 'Not in list'}
    </span>
  )
}

/**
 * Review recipe ingredients and optionally add/update Shopping List items.
 *
 * items: Array<{
 *   ingredientId: string,
 *   name: string,
 *   nameES?: string,
 *   optionalIngredient?: boolean,
 *   shoppingItem?: { id: string, name: string, status?: string, nameES?: string }
 * }>
 */
export function MealIngredientsShoppingModal({
  open,
  title,
  items = [],
  onClose,
  onConfirm,
  onSkip,
}) {
  const initial = useMemo(() => {
    const byKey = new Map()
    for (const it of items) {
      const key = it.ingredientId || normalizeName(it.name)
      if (it.shoppingItem?.id) {
        byKey.set(key, { mode: 'existing', need: (it.shoppingItem.status || 'Need') !== 'Have' })
      } else {
        byKey.set(key, { mode: 'missing', add: false })
      }
    }
    return byKey
  }, [items])

  const [stateByKey, setStateByKey] = useState(initial)

  const existing = items.filter((it) => it.shoppingItem?.id)
  const missing = items.filter((it) => !it.shoppingItem?.id)

  const toggleExistingNeed = (key) => {
    setStateByKey((prev) => {
      const next = new Map(prev)
      const cur = next.get(key)
      if (!cur || cur.mode !== 'existing') return prev
      next.set(key, { ...cur, need: !cur.need })
      return next
    })
  }

  const toggleMissingAdd = (key) => {
    setStateByKey((prev) => {
      const next = new Map(prev)
      const cur = next.get(key)
      if (!cur || cur.mode !== 'missing') return prev
      next.set(key, { ...cur, add: !cur.add })
      return next
    })
  }

  const handleConfirm = () => {
    const creates = []
    const updates = []
    for (const it of items) {
      const key = it.ingredientId || normalizeName(it.name)
      const st = stateByKey.get(key)
      if (!st) continue
      if (it.shoppingItem?.id && st.mode === 'existing') {
        const desired = st.need ? 'Need' : 'Have'
        const current = it.shoppingItem.status || 'Need'
        if (desired !== current) updates.push({ id: it.shoppingItem.id, status: desired })
      } else if (!it.shoppingItem?.id && st.mode === 'missing') {
        if (st.add) creates.push({ name: it.name, nameES: it.nameES, status: 'Need' })
      }
    }
    onConfirm?.({ creates, updates })
  }

  return (
    <Modal open={open} onClose={onClose} title={title} ariaLabelledBy="meal-ingredients-shopping-modal-title">
      <div className="space-y-4">
        <p className="text-sm text-text-muted">
          Review ingredients and decide what to add to your Shopping List. Items already in your list show as <b>Need</b> or <b>Have</b>.
        </p>

        {existing.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-semibold text-text">Already in your list</div>
            <ul className="space-y-2">
              {existing.map((it) => {
                const key = it.ingredientId || normalizeName(it.name)
                const st = stateByKey.get(key)
                const need = st?.mode === 'existing' ? st.need : (it.shoppingItem.status || 'Need') !== 'Have'
                const label = [it.nameES, it.name].filter(Boolean).join(' — ') || it.name
                return (
                  <li key={key} className="flex items-center gap-3 rounded-lg border border-border bg-surface px-3 py-2">
                    <input
                      type="checkbox"
                      checked={need}
                      onChange={() => toggleExistingNeed(key)}
                      className="rounded border-border text-primary focus:ring-primary"
                      aria-label={`Toggle Need/Have for ${label}`}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm text-text truncate">
                        {label}
                        {it.optionalIngredient ? <span className="text-text-muted"> (optional)</span> : null}
                      </div>
                    </div>
                    <StatusPill status={need ? 'Need' : 'Have'} />
                  </li>
                )
              })}
            </ul>
          </div>
        )}

        {missing.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-semibold text-text">Not in your list</div>
            <ul className="space-y-2">
              {missing.map((it) => {
                const key = it.ingredientId || normalizeName(it.name)
                const st = stateByKey.get(key)
                const add = st?.mode === 'missing' ? st.add : false
                const label = [it.nameES, it.name].filter(Boolean).join(' — ') || it.name
                return (
                  <li key={key} className="flex items-center gap-3 rounded-lg border border-border bg-surface px-3 py-2">
                    <input
                      type="checkbox"
                      checked={add}
                      onChange={() => toggleMissingAdd(key)}
                      className="rounded border-border text-primary focus:ring-primary"
                      aria-label={`Add ${label} to shopping list`}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm text-text truncate">
                        {label}
                        {it.optionalIngredient ? <span className="text-text-muted"> (optional)</span> : null}
                      </div>
                    </div>
                    <StatusPill status={add ? 'Need' : ''} />
                  </li>
                )
              })}
            </ul>
          </div>
        )}

        <div className="flex flex-wrap justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onSkip}
            className="px-4 py-2 rounded-lg border border-border text-text hover:bg-border"
          >
            Add meal only
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="px-4 py-2 rounded-lg bg-primary text-white hover:opacity-90"
          >
            Update shopping & add meal
          </button>
        </div>
      </div>
    </Modal>
  )
}

