/**
 * EntityListPage: layout genérico para páginas de lista con filtros.
 * Sin lógica de negocio; las apps proveen header, filters, summary, list y empty state.
 *
 * Props:
 * - header: ReactNode (típicamente PageHeader)
 * - filters?: ReactNode. Recomendado: fila 1 = buscador (input full width), fila 2 = FilterBar con FilterDropdowns (icono filtros + filtros).
 * - summary?: ReactNode (KPI bar, StatusProgressBar, etc.)
 * - children: contenido principal (lista de cards, CardList, etc.)
 * - emptyState?: ReactNode (cuando no hay items)
 * - showEmptyState: boolean (cuando true, se muestra emptyState en lugar de children)
 * - className?: string
 */
export function EntityListPage({
  header,
  filters,
  summary,
  children,
  emptyState,
  showEmptyState = false,
  className = '',
}) {
  return (
    <div className={`space-y-6 ${className}`.trim()}>
      {header}
      {filters != null && <div>{filters}</div>}
      {summary != null && <section>{summary}</section>}
      {showEmptyState && emptyState != null ? emptyState : children}
    </div>
  )
}
