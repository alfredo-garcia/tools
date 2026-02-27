/**
 * Gráfica de línea por fechas (SVG, sin dependencias).
 * Props:
 *   - data: Array<{ date: string (YYYY-MM-DD), value: number }> ordenado por date
 *   - targetValue: number (opcional) — línea horizontal de referencia
 *   - valueLabel: string (opcional) — etiqueta para la línea de valor
 *   - targetLabel: string (opcional) — etiqueta para la línea target
 *   - height: number (altura del SVG, default 200)
 *   - className: string
 */
export function LineChart({
  data = [],
  targetValue,
  valueLabel = 'Value',
  targetLabel = 'Target',
  height = 200,
  className = '',
}) {
  if (data.length === 0 && targetValue == null) return null

  const padding = { top: 12, right: 12, bottom: 28, left: 40 }
  const width = 400
  const innerWidth = width - padding.left - padding.right
  const innerHeight = height - padding.top - padding.bottom

  const values = data.map((d) => d.value).filter((v) => v != null && !Number.isNaN(v))
  const minVal = Math.min(...values, targetValue != null ? targetValue : Infinity)
  const maxVal = Math.max(...values, targetValue != null ? targetValue : -Infinity)
  const range = maxVal - minVal || 1
  const yMin = minVal - range * 0.05
  const yMax = maxVal + range * 0.05
  const yScale = (v) => padding.top + innerHeight - ((v - yMin) / (yMax - yMin)) * innerHeight
  const xScale = (i) => padding.left + (i / Math.max(1, data.length - 1)) * innerWidth

  const sortedData = [...data].sort((a, b) => (a.date || '').localeCompare(b.date || ''))
  const validPoints = sortedData
    .map((d, idx) => (d.value != null && !Number.isNaN(d.value) ? { x: xScale(idx), y: yScale(d.value) } : null))
    .filter(Boolean)
  const points = validPoints.map((p) => `${p.x},${p.y}`).join(' ')

  const formatDate = (d) => {
    if (!d) return ''
    const s = String(d).slice(0, 10)
    const [y, m, day] = s.split('-')
    return day && m ? `${day}/${m}` : s
  }

  const ticks = (() => {
    const n = 5
    const out = []
    for (let i = 0; i <= n; i++) out.push(yMin + (yMax - yMin) * (i / n))
    return out
  })()

  return (
    <div className={`w-full min-w-0 overflow-hidden ${className}`}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="block w-full h-auto"
        style={{ width: '100%' }}
        preserveAspectRatio="xMidYMid meet"
        aria-hidden
      >
        {/* Y axis ticks */}
        {ticks.map((t, i) => (
          <line
            key={i}
            x1={padding.left}
            y1={yScale(t)}
            x2={padding.left + innerWidth}
            y2={yScale(t)}
            stroke="var(--color-border, #e5e5e5)"
            strokeDasharray="2 2"
            strokeWidth={1}
          />
        ))}
        {/* Target line */}
        {targetValue != null && !Number.isNaN(targetValue) && (
          <line
            x1={padding.left}
            y1={yScale(targetValue)}
            x2={padding.left + innerWidth}
            y2={yScale(targetValue)}
            stroke="var(--color-primary, #f97316)"
            strokeWidth={2}
            strokeDasharray="6 4"
          />
        )}
        {/* Value line */}
        {points && (
          <polyline
            points={points}
            fill="none"
            stroke="var(--color-text, #171717)"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
        {/* Value points */}
        {sortedData.map((d, idx) =>
          d.value != null && !Number.isNaN(d.value) ? (
            <circle key={d.date} cx={xScale(idx)} cy={yScale(d.value)} r={4} fill="var(--color-text, #171717)" />
          ) : null
        )}
        {/* X axis labels (first, middle, last) */}
        {sortedData.length > 0 && (
          <>
            <text
              x={padding.left}
              y={height - 6}
              textAnchor="start"
              className="text-[10px] fill-[var(--color-text-muted)]"
              style={{ font: '10px sans-serif' }}
            >
              {formatDate(sortedData[0].date)}
            </text>
            <text
              x={padding.left + innerWidth / 2}
              y={height - 6}
              textAnchor="middle"
              className="text-[10px] fill-[var(--color-text-muted)]"
              style={{ font: '10px sans-serif' }}
            >
              {formatDate(sortedData[Math.floor(sortedData.length / 2)].date)}
            </text>
            <text
              x={padding.left + innerWidth}
              y={height - 6}
              textAnchor="end"
              className="text-[10px] fill-[var(--color-text-muted)]"
              style={{ font: '10px sans-serif' }}
            >
              {formatDate(sortedData[sortedData.length - 1].date)}
            </text>
          </>
        )}
        {/* Y axis labels */}
        {ticks.map((t, i) => (
          <text
            key={i}
            x={padding.left - 6}
            y={yScale(t)}
            textAnchor="end"
            dominantBaseline="middle"
            className="text-[10px] fill-[var(--color-text-muted)]"
            style={{ font: '10px sans-serif' }}
          >
            {Number(t).toLocaleString(undefined, { maximumFractionDigits: 1 })}
          </text>
        ))}
      </svg>
      <div className="flex items-center gap-4 mt-1 flex-wrap">
        <span className="inline-flex items-center gap-1.5 text-xs text-text-muted">
          <span className="w-3 h-0.5 bg-text rounded" />
          {valueLabel}
        </span>
        {targetValue != null && !Number.isNaN(targetValue) && (
          <span className="inline-flex items-center gap-1.5 text-xs text-text-muted">
            <span className="w-3 h-0.5 border-t-2 border-primary border-dashed" />
            {targetLabel}
          </span>
        )}
      </div>
    </div>
  )
}
