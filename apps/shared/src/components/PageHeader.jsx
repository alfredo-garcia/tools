import { useState } from 'react'
import { IconRefresh } from './Icons.jsx'

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
      <h1 className="text-xl font-bold text-text">{title}</h1>
      {onRefresh && (
        <button
          type="button"
          onClick={handleRefresh}
          disabled={isBusy}
          aria-label="Actualizar datos"
          className="shrink-0 p-2 rounded-xl border-2 border-border bg-surface text-text-muted hover:bg-surface hover:text-primary disabled:opacity-50 min-h-[44px] min-w-[44px] flex items-center justify-center touch-manipulation transition-colors active:scale-95"
        >
          <IconRefresh size={20} className={isBusy ? 'animate-spin' : ''} />
        </button>
      )}
    </div>
  )
}
