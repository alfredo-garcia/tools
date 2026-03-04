import { IconX } from '@tools/shared'

/**
 * Modal shown when adding a meal whose recipe has ingredients not marked as Have in the Shopping List.
 * Lists missing ingredients and asks if the user wants to add them to the Shopping List (set to Needs).
 * @param {Array<{ displayName: string, name: string, shoppingItem?: object }>} missingIngredients - From getMissingIngredients
 * @param {() => void} onConfirmNo - Called when user chooses not to add to list
 * @param {() => void} onConfirmYes - Called when user chooses to add to list (caller updates shopping then continues)
 * @param {() => void} onClose - Close without choosing (e.g. backdrop click)
 */
export function MissingIngredientsModal({
  missingIngredients = [],
  onConfirmNo,
  onConfirmYes,
  onClose,
}) {
  if (!missingIngredients.length) return null

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="missing-ingredients-modal-title"
    >
      <div
        className="bg-surface rounded-2xl border-2 border-border shadow-xl w-full max-w-md overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-border flex items-center justify-between gap-3 shrink-0">
          <h2 id="missing-ingredients-modal-title" className="font-bold text-xl text-text">
            Missing ingredients
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
        <div className="p-6 space-y-4">
          <p className="text-text">
            This recipe uses ingredients that are not marked as &quot;Have&quot; in your Shopping List:
          </p>
          <ul className="list-disc list-inside text-text space-y-1 max-h-48 overflow-y-auto">
            {missingIngredients.map(({ displayName, name }) => (
              <li key={name || displayName}>{displayName || name}</li>
            ))}
          </ul>
          <p className="text-text-muted text-sm">
            Do you want to add them to your Shopping List (set as Needs)?
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <button
              type="button"
              onClick={onConfirmNo}
              className="min-h-[44px] px-4 py-2 rounded-xl text-base font-medium bg-surface border-2 border-border text-text hover:ring-2 hover:ring-primary/30"
            >
              No
            </button>
            <button
              type="button"
              onClick={onConfirmYes}
              className="min-h-[44px] px-4 py-2 rounded-xl text-base font-medium bg-primary text-white hover:ring-2 hover:ring-primary/50"
            >
              Yes, add to Shopping List
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
