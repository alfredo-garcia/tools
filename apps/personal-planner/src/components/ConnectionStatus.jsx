/**
 * Shows connection and sync status: online/offline, syncing, pending changes, conflicts.
 * Renders a thin bar when offline or when there are pending/conflict counts.
 */
import { usePlannerApi } from '../contexts/PlannerApiContext'

export function ConnectionStatus() {
  const { isOnline, isSyncing, pendingCount, conflictCount, setConflictCount } = usePlannerApi()

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
          Sin conexión. Los cambios se guardarán localmente.
        </span>
      )}
      {isOnline && isSyncing && (
        <span className="text-muted">Sincronizando…</span>
      )}
      {pendingCount > 0 && (
        <span className="text-muted">
          {pendingCount} cambio{pendingCount !== 1 ? 's' : ''} pendiente{pendingCount !== 1 ? 's' : ''}
        </span>
      )}
      {conflictCount > 0 && (
        <span className="flex items-center gap-2">
          <span className="text-warning">
            {conflictCount} cambio{conflictCount !== 1 ? 's' : ''} no aplicado{conflictCount !== 1 ? 's' : ''} (conflicto)
          </span>
          <button
            type="button"
            onClick={handleDismissConflict}
            className="underline text-muted hover:text-text"
          >
            Cerrar
          </button>
        </span>
      )}
    </div>
  )
}
