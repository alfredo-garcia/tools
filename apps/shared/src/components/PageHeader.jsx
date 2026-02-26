import { useState } from 'react'
import { Link } from 'react-router-dom'
import { IconRefresh } from './Icons.jsx'

/**
 * breadcrumbs: [{ label, to? }] — last = current page (más grande); parents = breadcrumb pequeños.
 * Or title (string). onRefresh: icon spins while loading (usa clase .page-header-refresh-spin en app).
 */
export function PageHeader({ title, breadcrumbs, onRefresh, loading }) {
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

  const content = breadcrumbs ? (
    <nav className="flex items-center gap-1.5 flex-wrap items-baseline" aria-label="Breadcrumb">
      {breadcrumbs.map((item, i) => {
        const isLast = i === breadcrumbs.length - 1
        const isParent = !isLast
        const label = <span>{item.label}</span>
        return (
          <span key={i} className="flex items-center gap-1.5">
            {i > 0 && <span className="text-text-muted font-normal px-1 text-sm" aria-hidden>{' \ '}</span>}
            {item.to != null && isParent ? (
              <Link
                to={item.to}
                className="hover:text-primary transition-colors text-sm font-medium text-text-muted"
              >
                {label}
              </Link>
            ) : (
              <span className={isLast ? 'text-xl font-bold text-text' : 'text-sm font-medium text-text-muted'}>
                {label}
              </span>
            )}
          </span>
        )
      })}
    </nav>
  ) : (
    <h1 className="text-xl font-bold text-text">{title}</h1>
  )

  return (
    <div className="flex items-center gap-3 mb-6">
      {content}
      {onRefresh != null && (
        <button
          type="button"
          onClick={handleRefresh}
          disabled={isBusy}
          aria-label="Actualizar datos"
          className="shrink-0 p-2 text-text-muted hover:text-primary hover:opacity-100 opacity-80 disabled:opacity-50 min-h-[44px] min-w-[44px] flex items-center justify-center touch-manipulation transition-all cursor-pointer active:scale-95"
        >
          <IconRefresh
            size={20}
            className={isBusy ? 'page-header-refresh-spin' : ''}
            style={isBusy ? { animation: 'page-header-spin 0.7s linear infinite' } : undefined}
          />
        </button>
      )}
    </div>
  )
}
