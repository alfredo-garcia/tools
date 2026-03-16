/**
 * KpiCard: tarjeta neutra para mostrar un KPI.
 * - title: etiqueta pequeña
 * - value: valor principal (texto grande)
 * - subtitle: detalle opcional (texto pequeño)
 * - tone: 'default' | 'warning' | 'danger' (solo cambia el borde, no el copy)
 */
export function KpiCard({
  title,
  value,
  subtitle,
  tone = 'default',
  as: As = 'div',
  className = '',
  ...rest
}) {
  const toneClass =
    tone === 'danger'
      ? 'border-red-300 dark:border-red-700'
      : tone === 'warning'
        ? 'border-amber-300 dark:border-amber-700'
        : 'border-border'

  return (
    <As
      className={`rounded-2xl border border-2 ${toneClass} bg-surface p-5 shadow-sm ${className}`.trim()}
      {...rest}
    >
      {title && (
        <p className="text-sm font-medium text-text-muted">
          {title}
        </p>
      )}
      {value != null && (
        <p className="mt-1 text-2xl font-bold text-text">
          {value}
        </p>
      )}
      {subtitle != null && (
        <p className="mt-0.5 text-sm text-text-muted">
          {subtitle}
        </p>
      )}
    </As>
  )
}

