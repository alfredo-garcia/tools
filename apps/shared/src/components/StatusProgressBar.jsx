/**
 * StatusProgressBar: barra de progreso segmentada genérica.
 * Recibe totales por segmento y pinta proporciones relativas.
 */
export function StatusProgressBar({
  segments,
  total,
  ariaLabel,
  className = '',
}) {
  const safeTotal = total ?? Object.values(segments || {}).reduce((a, b) => a + b, 0)
  const entries = Object.entries(segments || {}).filter(([, n]) => n > 0)

  const pct = (n) => (safeTotal === 0 ? 0 : Math.round((n / safeTotal) * 100))

  return (
    <div
      className={`flex-1 h-2 rounded-full overflow-hidden flex min-w-0 ${className}`.trim()}
      role="progressbar"
      aria-label={ariaLabel}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={entries.reduce((max, [, n]) => Math.max(max, pct(n)), 0)}
    >
      {safeTotal === 0 ? (
        <div className="h-full bg-status-pending shrink-0 w-full" />
      ) : (
        entries.map(([key, n]) => {
          const width = pct(n)
          if (width <= 0) return null
          const colorClass =
            key === 'done'
              ? 'bg-status-done'
              : key === 'in_progress'
                ? 'bg-status-in-progress'
                : key === 'pending'
                  ? 'bg-status-pending'
                  : 'bg-border'
          return (
            <div
              key={key}
              className={`h-full shrink-0 ${colorClass}`}
              style={{ width: `${width}%` }}
            />
          )
        })
      )}
    </div>
  )
}

