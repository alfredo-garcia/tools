/**
 * EntityDetailPage: layout genérico para páginas de detalle de una entidad.
 * Sin lógica de negocio; las apps proveen backLink, header, children (propiedades, secciones).
 *
 * Props:
 * - backLink?: ReactNode (ej. <Link to="/tasks">← Back to tasks</Link>)
 * - header: ReactNode (típicamente PageHeader)
 * - children: contenido principal (card con dl, secciones, etc.)
 * - className?: string
 */
export function EntityDetailPage({ backLink, header, children, className = '' }) {
  return (
    <div className={`space-y-6 ${className}`.trim()}>
      {backLink != null && <div>{backLink}</div>}
      {header}
      {children}
    </div>
  )
}
