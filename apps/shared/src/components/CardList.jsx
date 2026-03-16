import { useState, useMemo } from 'react'
import { IconChevronDown, IconChevronUp } from './Icons.jsx'

/**
 * CardList: dos modos de uso.
 *
 * 1) Lista simple (solo children): renderiza los hijos en un contenedor con espaciado.
 *
 * 2) Lista agrupada: items, groupBy, groupOrder, groupLabels, renderItem.
 *    - items: array
 *    - groupBy: (item) => groupKey
 *    - groupOrder: [groupKey, ...]
 *    - groupLabels: { [groupKey]: string }
 *    - renderItem: (item) => ReactNode (típicamente un Card)
 *    - initialCollapsed: { [groupKey]: boolean } opcional
 */
export function CardList({
  items,
  groupBy,
  groupOrder,
  groupLabels,
  renderItem,
  initialCollapsed = {},
  children,
}) {
  const [collapsed, setCollapsed] = useState(initialCollapsed)

  const groups = useMemo(() => {
    if (items == null || groupBy == null || groupOrder == null) return null
    const map = {}
    groupOrder.forEach((key) => { map[key] = [] })
    items.forEach((item) => {
      const key = groupBy(item)
      if (map[key]) map[key].push(item)
    })
    return map
  }, [items, groupBy, groupOrder])

  if (groups == null) {
    return <ul className="space-y-2 list-none p-0 m-0">{children}</ul>
  }

  const toggle = (key) => {
    setCollapsed((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <div className="space-y-6">
      {groupOrder.map((key) => {
        const groupItems = groups[key] || []
        if (groupItems.length === 0) return null
        const isCollapsed = collapsed[key]
        const label = groupLabels[key] ?? key
        return (
          <section key={key}>
            <button
              type="button"
              onClick={() => toggle(key)}
              className="flex items-center gap-2 w-full text-left py-1.5 font-medium text-text hover:text-primary transition-colors"
            >
              <span className="text-base">{label}</span>
              <span className="text-text-muted font-normal text-sm">{groupItems.length}</span>
              <span className="ml-auto text-text-muted">
                {isCollapsed ? <IconChevronDown size={18} /> : <IconChevronUp size={18} />}
              </span>
            </button>
            {!isCollapsed && (
              <ul className="mt-2 space-y-2 list-none p-0 m-0">
                {groupItems.map((item) => (
                  <li key={item.id}>{renderItem(item)}</li>
                ))}
              </ul>
            )}
          </section>
        )
      })}
    </div>
  )
}
