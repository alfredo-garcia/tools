/**
 * Gráfica de área apilada por fechas (SVG, sin dependencias).
 * Props:
 *   - data: Array<{ date: string (YYYY-MM-DD), [seriesKey: string]: number }> ordenado por date
 *   - series: Array<{ key: string, label: string, color?: string }> — cada key debe existir en data[i]
 *   - height: number (altura del SVG en viewBox, default 200)
 *   - maxHeight: number (opcional)
 *   - className: string
 */
export function AreaChart({
  data = [],
  series = [],
  height = 200,
  maxHeight,
  className = '',
}) {
  if (data.length === 0 || series.length === 0) return null

  const padding = { top: 12, right: 12, bottom: 28, left: 40 }
  const width = 400
  const innerWidth = width - padding.left - padding.right
  const innerHeight = height - padding.top - padding.bottom

  const sortedData = [...data].sort((a, b) => (a.date || '').localeCompare(b.date || ''))
  const keys = series.map((s) => s.key)
  const totalsPerPoint = sortedData.map((d) => keys.reduce((sum, k) => sum + (Number(d[k]) || 0), 0))
  const maxVal = Math.max(...totalsPerPoint, 1)
  const yScale = (v) => padding.top + innerHeight - (v / maxVal) * innerHeight
  const xScale = (i) => padding.left + (i / Math.max(1, sortedData.length - 1)) * innerWidth

  const defaultColors = ['#f97316', '#22c55e', '#3b82f6', '#a855f7', '#eab308', '#64748b', '#ec4899', '#14b8a6']
  const getColor = (i) => series[i]?.color || defaultColors[i % defaultColors.length]

  const formatDate = (d) => {
    if (!d) return ''
    const s = String(d).slice(0, 10)
    const [y, m, day] = s.split('-')
    return day && m ? `${day}/${m}` : s
  }

  let cumulative = sortedData.map(() => 0)
  const paths = keys.map((key, seriesIndex) => {
    const points = []
    let top = cumulative.slice()
    for (let i = 0; i < sortedData.length; i++) {
      const v = Number(sortedData[i][key]) || 0
      top[i] = cumulative[i] + v
    }
    for (let i = 0; i < sortedData.length; i++) {
      points.push(`${xScale(i)},${yScale(top[i])}`)
    }
    for (let i = sortedData.length - 1; i >= 0; i--) {
      points.push(`${xScale(i)},${yScale(cumulative[i])}`)
    }
    cumulative = top
    return { d: `M${points.join(' L')} Z`, color: getColor(seriesIndex) }
  })

  const useFixedHeight = maxHeight != null
  return (
    <div className={`w-full min-w-0 overflow-hidden ${className}`}>
      <div
        className="w-full"
        style={useFixedHeight ? { height: maxHeight } : undefined}
      >
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="block w-full"
          style={{
            width: '100%',
            height: useFixedHeight ? '100%' : 'auto',
          }}
          preserveAspectRatio={useFixedHeight ? 'none' : 'xMidYMid meet'}
          aria-hidden
        >
          {paths.map((path, i) => (
            <path
              key={i}
              d={path.d}
              fill={path.color}
              fillOpacity={0.85}
              stroke={path.color}
              strokeWidth={1}
              strokeOpacity={0.5}
            />
          ))}
        </svg>
      </div>
      {/* Eje X: fechas fuera del SVG para tamaño fijo */}
      {sortedData.length > 0 && (
        <div
          className="flex justify-between mt-0.5 px-1"
          style={{ fontSize: '11px', lineHeight: 1, color: 'var(--color-text-muted)' }}
        >
          <span>{formatDate(sortedData[0].date)}</span>
          <span>{formatDate(sortedData[Math.floor(sortedData.length / 2)].date)}</span>
          <span>{formatDate(sortedData[sortedData.length - 1].date)}</span>
        </div>
      )}
      {/* Leyenda: tamaño fijo en px, no depende del SVG */}
      <div
        className="flex flex-wrap items-center justify-center gap-3 mt-2"
        style={{ fontSize: '12px', lineHeight: 1.2 }}
      >
        {series.map((s, i) => (
          <span
            key={s.key}
            className="inline-flex items-center gap-1.5 shrink-0"
            style={{ color: 'var(--color-text-muted)' }}
          >
            <span
              style={{
                width: 12,
                height: 12,
                borderRadius: 2,
                backgroundColor: getColor(i),
                flexShrink: 0,
              }}
            />
            <span style={{ fontSize: '12px' }}>{s.label}</span>
          </span>
        ))}
      </div>
    </div>
  )
}
