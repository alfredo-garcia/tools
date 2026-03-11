import { useState, useMemo } from 'react'
import { IconX } from '@tools/shared'

/**
 * Modal shown when adding a recipe whose ingredients appear in the Shopping List.
 * Lists those ingredients grouped by Need (first) and Have, with a checkbox per item (checked = Need, unchecked = Have).
 * User can toggle and then Confirm (add recipe + update shopping statuses) or Back (cancel, no changes).
 * @param {Array<{ displayName: string, name: string, shoppingItem: object, status: 'Have'|'Need' }>} ingredientsInList - Recipe ingredients that are in the shopping list (order: Need first, then Have)
 * @param {(updates: Array<{ shoppingItem: object, status: 'Have'|'Need' }>) => void} onConfirm - Called with desired status per item; caller adds meal and PATCHes shopping
 * @param {() => void} onBack - Cancel: close without adding recipe or changing shopping
 */
export function MissingIngredientsModal({
  ingredientsInList = [],
  onConfirm,
  onBack,
}) {
  const initialStatusById = useMemo(() => {
    const map = new Map()
    ingredientsInList.forEach((item) => {
      map.set(item.shoppingItem.id, item.status === 'Need')
    })
    return map
  }, [ingredientsInList])

  const [needById, setNeedById] = useState(initialStatusById)

  const toggle = (id) => {
    setNeedById((prev) => {
      const next = new Map(prev)
      next.set(id, !next.get(id))
      return next
    })
  }

  const handleConfirm = () => {
    const updates = ingredientsInList.map((item) => ({
      shoppingItem: item.shoppingItem,
      status: needById.get(item.shoppingItem.id) ? 'Need' : 'Have',
    }))
    onConfirm?.(updates)
  }

  const needItems = ingredientsInList.filter((item) => item.status === 'Need')
  const haveItems = ingredientsInList.filter((item) => item.status === 'Have')

  if (!ingredientsInList.length) return null

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60"
      onClick={onBack}
      role="dialog"
      aria-modal="true"
      aria-labelledby="missing-ingredients-modal-title"
    >
      <div
        className="bg-surface rounded-2xl border-2 border-border shadow-xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-border flex items-center justify-between gap-3 shrink-0">
          <h2 id="missing-ingredients-modal-title" className="font-bold text-xl text-text">
            Ingredients in your list
          </h2>
          <button
            type="button"
            onClick={onBack}
            className="shrink-0 p-2 rounded-lg text-text-muted hover:bg-border text-xl leading-none"
            aria-label="Close"
          >
            <IconX size={20} />
          </button>
        </div>
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          <p className="text-text text-sm">
            This recipe uses ingredients that are in your Shopping List. Check &quot;Need&quot; for those you need to buy and uncheck those you already have (&quot;Have&quot;).
          </p>
          {/* Need first */}
          {needItems.length > 0 && (
            <div>
              <h3 className="font-semibold text-text mb-2">Need</h3>
              <ul className="space-y-2">
                {needItems.map(({ displayName, name, shoppingItem }) => (
                  <li key={shoppingItem.id} className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id={`need-${shoppingItem.id}`}
                      checked={needById.get(shoppingItem.id) ?? true}
                      onChange={() => toggle(shoppingItem.id)}
                      className="rounded border-border text-primary focus:ring-primary"
                    />
                    <label htmlFor={`need-${shoppingItem.id}`} className="text-text cursor-pointer flex-1">
                      {displayName || name}
                    </label>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {/* Have second */}
          {haveItems.length > 0 && (
            <div>
              <h3 className="font-semibold text-text mb-2">Have</h3>
              <ul className="space-y-2">
                {haveItems.map(({ displayName, name, shoppingItem }) => (
                  <li key={shoppingItem.id} className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id={`have-${shoppingItem.id}`}
                      checked={needById.get(shoppingItem.id) ?? false}
                      onChange={() => toggle(shoppingItem.id)}
                      className="rounded border-border text-primary focus:ring-primary"
                    />
                    <label htmlFor={`have-${shoppingItem.id}`} className="text-text cursor-pointer flex-1">
                      {displayName || name}
                    </label>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="flex flex-wrap gap-3 pt-2">
            <button
              type="button"
              onClick={onBack}
              className="min-h-[44px] px-4 py-2 rounded-xl text-base font-medium bg-surface border-2 border-border text-text hover:ring-2 hover:ring-primary/30"
            >
              Back
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="min-h-[44px] px-4 py-2 rounded-xl text-base font-medium bg-primary text-white hover:ring-2 hover:ring-primary/50"
            >
              Confirm
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
