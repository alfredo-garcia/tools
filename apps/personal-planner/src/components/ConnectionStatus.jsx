/**
 * Shows connection and sync status: online/offline, syncing, pending changes, conflicts.
 * Renders a thin bar when offline or when there are pending/conflict counts.
 */
import { useContext } from 'react'
import { PlannerApiContext } from '../contexts/PlannerApiContext'

export function ConnectionStatus() {
  const ctx = useContext(PlannerApiContext)
  if (!ctx) return null
  const { isOnline = true, isSyncing = false, pendingCount = 0, conflictCount = 0, setConflictCount } = ctx

  if (isOnline && !isSyncing && pendingCount === 0 && conflictCount === 0) return null

  const handleDismissConflict = () => setConflictCount(0)

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-wrap items-center justify-center gap-2 px-3 py-1.5 text-sm bg-surface border-b border-border"
    >
      {!isOnline && (
        <span className="font-medium text-warning">
          Offline. Changes will be saved locally.
        </span>
      )}
      {isOnline && isSyncing && (
        <span className="text-muted">Syncing…</span>
      )}
      {pendingCount > 0 && (
        <span className="text-muted">
          {pendingCount} change{pendingCount !== 1 ? 's' : ''} pending
        </span>
      )}
      {conflictCount > 0 && (
        <span className="flex items-center gap-2">
          <span className="text-warning">
            {conflictCount} change{conflictCount !== 1 ? 's' : ''} not applied (conflict)
          </span>
          <button
            type="button"
            onClick={handleDismissConflict}
            className="underline text-muted hover:text-text"
          >
            Dismiss
          </button>
        </span>
      )}
    </div>
  )
}
