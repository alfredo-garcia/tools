import { useState } from 'react'
import { IconRefresh } from './Icons'

/**
 * Título de página con icono de refresh opcional.
 * onRefresh: si se pasa, se muestra el botón y al clicar se llama (puede ser async).
 */
export function PageHeader({ title, onRefresh, loading }) {
  const [refreshing, setRefreshing] = useState(false)
  const isBusy = loading || refreshing

  const handleRefresh = async () => {
    if (!onRefresh || isBusy) return
    setRefreshing(true)
    try {
      await Promise.resolve(onRefresh())
    } finally {
      setRefreshing(false)
    }
  }

  return (
    <div className="flex items-center gap-2 mb-6">
      <h1 className="text-xl font-bold text-neutral-900 dark:text-white">
        {title}
      </h1>
      {onRefresh && (
        <button
          type="button"
          onClick={handleRefresh}
          disabled={isBusy}
          aria-label="Actualizar datos"
          className="shrink-0 p-2 rounded-xl border-2 border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 hover:text-orange-500 dark:hover:bg-neutral-800 dark:hover:text-orange-400 disabled:opacity-50 min-h-[44px] min-w-[44px] flex items-center justify-center touch-manipulation transition-colors active:scale-95"
        >
          <IconRefresh size={20} className={isBusy ? 'animate-spin' : ''} />
        </button>
      )}
    </div>
  )
}
