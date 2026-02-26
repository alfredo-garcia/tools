import { useState } from 'react'
import { IconChevronDown, IconChevronUp } from './Icons.jsx'

/**
 * Card: sin borde, fondo ligeramente distinto (bg-surface).
 * - title, icon opcional
 * - children = contenido principal
 * - expandable: muestra toggle y contenido extra en expandedContent
 * - buttons: nodo(s) que se muestran debajo
 */
export function Card({
  title,
  icon,
  children,
  expandable = false,
  defaultExpanded = false,
  expandedContent,
  buttons,
  className = '',
  ...rest
}) {
  const [expanded, setExpanded] = useState(defaultExpanded)

  return (
    <div
      className={`rounded-xl bg-surface overflow-hidden ${className}`}
      {...rest}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          {icon && <div className="shrink-0 mt-0.5 text-text-muted">{icon}</div>}
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-text">{title}</div>
            {children && <div className="mt-1 text-sm text-text-muted">{children}</div>}
          </div>
          {expandable && (
            <button
              type="button"
              onClick={() => setExpanded((e) => !e)}
              aria-expanded={expanded}
              className="shrink-0 p-1.5 rounded-lg text-text-muted hover:text-text hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            >
              {expanded ? <IconChevronUp size={18} /> : <IconChevronDown size={18} />}
            </button>
          )}
        </div>
        {expandable && expanded && expandedContent && (
          <div className="mt-3 pt-3 border-t border-border text-sm text-text-muted">
            {expandedContent}
          </div>
        )}
        {buttons && <div className="mt-3 flex flex-wrap gap-2">{buttons}</div>}
      </div>
    </div>
  )
}
