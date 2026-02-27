import { useState } from 'react'
import { Link } from 'react-router-dom'
import { IconRefresh, IconChevronLeft } from './Icons.jsx'

/**
 * breadcrumbs: [{ label, to? }] — last = current page (más grande); parents = breadcrumb pequeños.
 * Or title (string). onRefresh: icon spins while loading (usa clase .page-header-refresh-spin en app).
 * Back arrow (mobile only): visible cuando hay ≥ 2 items en breadcrumbs, navega al parent inmediato.
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

  const parent = breadcrumbs?.length > 1 ? breadcrumbs[breadcrumbs.length - 2] : null

  const content = breadcrumbs ? (
    <nav className="flex items-baseline gap-1.5 flex-wrap" aria-label="Breadcrumb">
      {breadcrumbs.map((item, i) => {
        const isLast = i === breadcrumbs.length - 1
        const isParent = !isLast
        return (
          <span key={i} className="flex items-baseline gap-1.5">
            {i > 0 && (
              <span className="page-header-breadcrumb-sep text-text-muted font-normal text-base select-none" aria-hidden>
                \
              </span>
            )}
            {item.to != null && isParent ? (
              <Link
                to={item.to}
                className="text-base font-medium text-text-muted hover:text-primary transition-colors underline-offset-2 hover:underline"
              >
                {item.label}
              </Link>
            ) : (
              <span className={isLast ? 'text-2xl font-bold text-text' : 'text-base font-medium text-text-muted'}>
                {item.label}
              </span>
            )}
          </span>
        )
      })}
    </nav>
  ) : (
    <h1 className="text-2xl font-bold text-text">{title}</h1>
  )

  return (
    <div className="flex items-center gap-2 mb-6">
      {parent?.to && (
        <Link
          to={parent.to}
          aria-label={`Back to ${parent.label}`}
          className="app-header-back md:hidden shrink-0 -ml-1 p-2 rounded-xl text-text-muted hover:text-primary hover:bg-surface transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
        >
          <IconChevronLeft size={30} />
        </Link>
      )}
      <div className="flex-1 flex items-center gap-3">
        {content}
        {onRefresh != null && (
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isBusy}
            aria-label="Refresh data"
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
    </div>
  )
}
