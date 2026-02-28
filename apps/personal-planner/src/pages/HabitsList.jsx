import { useState, useEffect, useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useApi, Spinner, PageHeader } from '@tools/shared'
import { field, str, dateStr } from '@tools/shared'
import { isThisWeek, isThisMonth, isInLastDays, getTodayStr, getDaysAgoStr } from '@tools/shared'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Legend,
  AreaChart,
  Area,
  ReferenceLine,
} from 'recharts'

const HABIT_TYPE_FILTERS = [
  { value: 'Good', label: 'Good' },
  { value: 'Bad', label: 'Bad' },
  { value: 'All', label: 'All' },
]

const CATEGORY_COLORS = ['#f97316', '#22c55e', '#3b82f6', '#a855f7', '#eab308', '#64748b', '#ec4899', '#14b8a6']

function filterHabitsByType(habits, type) {
  if (type === 'All') return habits
  const want = String(type).trim().toLowerCase()
  return habits.filter((h) => {
    const v = str(field(h, 'Habit type', 'Habit Type')) || ''
    return v.trim().toLowerCase() === want
  })
}

function getHabitsByCategory(habits) {
  const map = new Map()
  for (const h of habits) {
    const cat = str(field(h, 'Category', 'Category')) || '(sin categoría)'
    if (!map.has(cat)) map.set(cat, [])
    map.get(cat).push(h)
  }
  return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]))
}

function isSuccess(t) {
  const v = field(t, 'Was Successful?', 'Was Successful')
  return v === true || String(v).toLowerCase() === 'yes' || v === '1'
}

function getTrackingDate(t) {
  return dateStr(field(t, 'Execution Date-Time', 'Execution Date-Time', 'Execution Date'))?.slice(0, 10) || ''
}

function getHabitId(t) {
  const link = field(t, 'Habit', 'Habit')
  const arr = Array.isArray(link) ? link : link != null ? [link] : []
  return arr[0] || null
}

function weekKey(d) {
  if (!d) return ''
  const x = new Date(d)
  const day = x.getDay()
  const diff = x.getDate() - (day === 0 ? -6 : day - 1)
  x.setDate(diff)
  return x.toISOString().slice(0, 10)
}

/** Average successful hits per day by category for a period. Returns [{ category, avg }]. */
function avgHitsByCategory(habits, trackingInPeriod, habitIds, periodDays) {
  if (periodDays < 1) periodDays = 1
  const byCat = new Map()
  for (const [cat, habitsInCat] of getHabitsByCategory(habits)) {
    const ids = new Set(habitsInCat.map((h) => h.id))
    let success = 0
    for (const t of trackingInPeriod) {
      if (!isSuccess(t)) continue
      const hid = getHabitId(t)
      if (hid && ids.has(hid) && habitIds.has(hid)) success += 1
    }
    const avg = success / periodDays
    byCat.set(cat, { category: cat, avg: Math.round(avg * 10) / 10 })
  }
  return [...byCat.values()].filter((d) => d.avg > 0).sort((a, b) => b.avg - a.avg)
}

/** Success % for a period (0-100). */
function successPctForPeriod(trackingInPeriod) {
  if (trackingInPeriod.length === 0) return 0
  const ok = trackingInPeriod.filter(isSuccess).length
  return Math.round((ok / trackingInPeriod.length) * 100)
}

/** Formatea fecha YYYY-MM-DD a dd/mm */
function formatDateShort(dateStr) {
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}/.test(dateStr)) return ''
  const [, m, d] = dateStr.slice(0, 10).split('-')
  return d && m ? `${d}/${m}` : dateStr.slice(0, 10)
}

/**
 * Gráfico de área apilada con Recharts: ejes y leyenda alineados, todos los días o cada 2–3,
 * y raya vertical donde hay registro.
 */
function StackedAreaChartRecharts({ data = [], series = [], height = 260 }) {
  if (!data.length || !series.length) return null
  const keys = series.map((s) => s.key)
  const hasData = (row) => keys.some((k) => (row[k] || 0) > 0)
  const datesWithRecords = data.filter(hasData).map((r) => r.date)
  const n = data.length
  const xInterval = n <= 21 ? 0 : n <= 45 ? 1 : 2
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 28, bottom: 28, left: 28 }}>
        <XAxis
          dataKey="date"
          tickFormatter={formatDateShort}
          interval={xInterval}
          tick={{ fontSize: 11 }}
        />
        <YAxis hide />
        <Tooltip
          labelFormatter={(value) => formatDateShort(value)}
          formatter={(value, name) => [value, name]}
        />
        {datesWithRecords.map((date) => (
          <ReferenceLine key={date} x={date} stroke="var(--color-border)" strokeWidth={1} />
        ))}
        {series.map((s, i) => (
          <Area
            key={s.key}
            type="monotone"
            dataKey={s.key}
            name={s.label}
            stackId="1"
            stroke={s.color || CATEGORY_COLORS[i % CATEGORY_COLORS.length]}
            fill={s.color || CATEGORY_COLORS[i % CATEGORY_COLORS.length]}
            fillOpacity={0.85}
          />
        ))}
        <Legend wrapperStyle={{ fontSize: 12 }} />
      </AreaChart>
    </ResponsiveContainer>
  )
}

function KpiBlock({ periodLabel, pct, barData, barHeight = 140 }) {
  return (
    <div className="rounded-2xl border border-2 border-border bg-surface p-4">
      <p className="text-2xl font-bold text-text">{pct}%</p>
      <p className="text-sm text-text-muted mb-3">{periodLabel}</p>
      {barData?.length > 0 ? (
        <ResponsiveContainer width="100%" height={barHeight}>
          <BarChart data={barData} layout="vertical" margin={{ left: 4, right: 24 }}>
            <XAxis type="number" allowDecimals tick={{ fontSize: 10 }} />
            <YAxis type="category" dataKey="category" width={72} tick={{ fontSize: 11 }} />
            <Tooltip formatter={(v) => [v, 'Promedio/día']} />
            <Bar dataKey="avg" radius={[0, 4, 4, 0]} fill="#f97316" name="Promedio" />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <p className="text-xs text-text-muted">Sin datos</p>
      )}
    </div>
  )
}

export function HabitsList() {
  const { fetchApi } = useApi()
  const [list, setList] = useState([])
  const [tracking, setTracking] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('Good')

  const refetch = useCallback(() => {
    setLoading(true)
    setError(null)
    Promise.all([
      fetchApi('/api/habits').then((r) => r.data || []),
      fetchApi('/api/habit-tracking').then((r) => r.data || []),
    ])
      .then(([h, t]) => {
        setList(h)
        setTracking(t || [])
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [fetchApi])

  useEffect(() => {
    refetch()
  }, [refetch])

  const filteredHabits = useMemo(() => filterHabitsByType(list, filter), [list, filter])
  const filteredIds = useMemo(() => new Set(filteredHabits.map((h) => h.id)), [filteredHabits])

  const trackingForFiltered = useMemo(() => {
    return (tracking || []).filter((t) => {
      const hid = getHabitId(t)
      return hid && filteredIds.has(hid)
    })
  }, [tracking, filteredIds])

  const today = getTodayStr()
  const threeMonthsAgo = getDaysAgoStr(90)
  const chartStart = useMemo(() => {
    const dates = trackingForFiltered.map((t) => getTrackingDate(t)).filter(Boolean)
    if (dates.length === 0) return threeMonthsAgo
    const first = dates.sort()[0]
    return first < threeMonthsAgo ? threeMonthsAgo : first
  }, [trackingForFiltered, threeMonthsAgo])

  const last3Days = useMemo(() => trackingForFiltered.filter((t) => isInLastDays(getTrackingDate(t), 3)), [trackingForFiltered])
  const thisWeek = useMemo(() => trackingForFiltered.filter((t) => isThisWeek(getTrackingDate(t))), [trackingForFiltered])
  const thisMonth = useMemo(() => trackingForFiltered.filter((t) => isThisMonth(getTrackingDate(t))), [trackingForFiltered])

  const pct3 = successPctForPeriod(last3Days)
  const pctWeek = successPctForPeriod(thisWeek)
  const pctMonth = successPctForPeriod(thisMonth)

  const barLast3 = useMemo(() => avgHitsByCategory(filteredHabits, last3Days, filteredIds, 3), [filteredHabits, last3Days, filteredIds])
  const barWeek = useMemo(() => avgHitsByCategory(filteredHabits, thisWeek, filteredIds, 7), [filteredHabits, thisWeek, filteredIds])
  const barMonth = useMemo(() => {
    const now = new Date()
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
    return avgHitsByCategory(filteredHabits, thisMonth, filteredIds, daysInMonth)
  }, [filteredHabits, thisMonth, filteredIds])

  const chartRangeDays = useMemo(() => {
    const a = new Date(chartStart)
    const b = new Date(today)
    return Math.max(1, Math.round((b - a) / (24 * 60 * 60 * 1000)) + 1)
  }, [chartStart, today])

  const trackingInRange = useMemo(() => {
    return trackingForFiltered.filter((t) => {
      const d = getTrackingDate(t)
      return d && d >= chartStart && d <= today
    })
  }, [trackingForFiltered, chartStart, today])

  const areaChartDataByCategory = useMemo(() => {
    const dayCount = {}
    for (let i = 0; i < chartRangeDays; i++) {
      const d = new Date(chartStart)
      d.setDate(d.getDate() + i)
      const s = d.toISOString().slice(0, 10)
      if (s > today) break
      dayCount[s] = { date: s }
    }
    const categories = getHabitsByCategory(filteredHabits)
    categories.forEach(([cat]) => {
      Object.keys(dayCount).forEach((date) => { dayCount[date][cat] = 0 })
    })
    for (const t of trackingInRange) {
      if (!isSuccess(t)) continue
      const d = getTrackingDate(t)
      const hid = getHabitId(t)
      if (!d || !dayCount[d] || !hid) continue
      const habit = filteredHabits.find((h) => h.id === hid)
      const cat = habit ? (str(field(habit, 'Category', 'Category')) || '(sin categoría)') : null
      if (cat && dayCount[d][cat] !== undefined) dayCount[d][cat] += 1
    }
    const series = categories.map(([cat]) => ({ key: cat, label: cat }))
    return { data: Object.values(dayCount).sort((a, b) => a.date.localeCompare(b.date)), series }
  }, [filteredHabits, trackingInRange, chartStart, today, chartRangeDays])

  /** Por cada categoría de hábitos: área (por día, apilada por hábito), barras (por semana), pie (reparto por hábito). */
  const categoryCardsData = useMemo(() => {
    const categories = getHabitsByCategory(filteredHabits)
    return categories.map(([categoryName, habitsInCategory], catIdx) => {
      const habitIdsCat = new Set(habitsInCategory.map((h) => h.id))
      const trackingCat = trackingInRange.filter((t) => habitIdsCat.has(getHabitId(t)))
      const trackingCatSuccess = trackingCat.filter(isSuccess)

      const dayCount = {}
      for (let i = 0; i < chartRangeDays; i++) {
        const d = new Date(chartStart)
        d.setDate(d.getDate() + i)
        const s = d.toISOString().slice(0, 10)
        if (s > today) break
        dayCount[s] = { date: s }
      }
      habitsInCategory.forEach((h) => {
        const name = str(field(h, 'Habit Name', 'Habit Name')) || h.id
        Object.keys(dayCount).forEach((date) => { dayCount[date][name] = 0 })
      })
      for (const t of trackingCatSuccess) {
        const d = getTrackingDate(t)
        const hid = getHabitId(t)
        const habit = habitsInCategory.find((h) => h.id === hid)
        const name = habit ? (str(field(habit, 'Habit Name', 'Habit Name')) || habit.id) : null
        if (d && dayCount[d] && name !== null) dayCount[d][name] = (dayCount[d][name] || 0) + 1
      }
      const areaData = Object.values(dayCount).sort((a, b) => a.date.localeCompare(b.date))
      const areaSeries = habitsInCategory.map((h, i) => ({
        key: str(field(h, 'Habit Name', 'Habit Name')) || h.id,
        label: (str(field(h, 'Habit Name', 'Habit Name')) || h.id).slice(0, 20),
        color: CATEGORY_COLORS[(catIdx * 3 + i) % CATEGORY_COLORS.length],
      }))

      const byWeek = {}
      trackingCatSuccess.forEach((t) => {
        const d = getTrackingDate(t)
        if (!d) return
        const w = weekKey(d)
        const habit = habitsInCategory.find((h) => h.id === getHabitId(t))
        const label = habit ? (str(field(habit, 'Habit Name', 'Habit Name')) || habit.id) : null
        if (!byWeek[w]) {
          byWeek[w] = { week: w, name: `${d.slice(8, 10)}/${d.slice(5, 7)}` }
          habitsInCategory.forEach((h) => {
            const k = str(field(h, 'Habit Name', 'Habit Name')) || h.id
            byWeek[w][k] = 0
          })
        }
        if (label !== null && byWeek[w][label] !== undefined) byWeek[w][label] += 1
      })
      const barData = Object.values(byWeek)
        .filter((row) => row.week != null)
        .sort((a, b) => a.week.localeCompare(b.week))
        .slice(-8)
      const barSeries = habitsInCategory.map((h, i) => ({
        key: str(field(h, 'Habit Name', 'Habit Name')) || h.id,
        label: (str(field(h, 'Habit Name', 'Habit Name')) || h.id).slice(0, 16),
        color: CATEGORY_COLORS[(catIdx * 3 + i) % CATEGORY_COLORS.length],
      }))

      const pieData = habitsInCategory.map((h, i) => {
        const name = str(field(h, 'Habit Name', 'Habit Name')) || h.id
        const count = trackingCatSuccess.filter((t) => getHabitId(t) === h.id).length
        return { name: name.slice(0, 18), value: count, fill: CATEGORY_COLORS[(catIdx * 3 + i) % CATEGORY_COLORS.length] }
      }).filter((d) => d.value > 0)

      return { categoryName, habitsInCategory, areaData, areaSeries, barData, barSeries, pieData }
    })
  }, [filteredHabits, trackingInRange, chartStart, today, chartRangeDays])

  if (loading && list.length === 0) return <div className="flex justify-center py-12"><Spinner size="lg" /></div>
  if (error && list.length === 0) return <p className="text-red-600 dark:text-red-400">{error}</p>

  return (
    <div className="space-y-6">
      <PageHeader breadcrumbs={[{ label: 'Home', to: '/' }, { label: 'Habits', to: '/habits' }]} onRefresh={refetch} loading={loading} />

      <div className="flex flex-wrap gap-2">
        {HABIT_TYPE_FILTERS.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            onClick={() => setFilter(value)}
            className={`min-h-[44px] px-4 py-2 rounded-xl text-base font-medium ${
              filter === value ? 'bg-primary text-white' : 'bg-surface border-2 border-border text-text'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KpiBlock periodLabel="últimos 3 días" pct={pct3} barData={barLast3} />
        <KpiBlock periodLabel="esta semana" pct={pctWeek} barData={barWeek} />
        <KpiBlock periodLabel="este mes" pct={pctMonth} barData={barMonth} />
      </section>

      {areaChartDataByCategory.series.length > 0 && areaChartDataByCategory.data.some((d) => areaChartDataByCategory.series.some((s) => (d[s.key] || 0) > 0)) && (
        <section className="rounded-2xl border border-2 border-border bg-surface p-5">
          <h2 className="text-base font-semibold text-text mb-3">Por categoría (desde {chartStart} hasta hoy)</h2>
          <StackedAreaChartRecharts
            data={areaChartDataByCategory.data}
            series={areaChartDataByCategory.series.map((s, i) => ({ ...s, color: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }))}
            height={260}
          />
        </section>
      )}

      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {categoryCardsData.map(({ categoryName, areaData, areaSeries, barData, barSeries, pieData }) => (
          <div
            key={categoryName}
            className="rounded-2xl border border-2 border-border bg-surface p-4 space-y-4"
          >
            <h2 className="text-lg font-semibold text-text">
              {categoryName}
            </h2>

            {areaSeries.length > 0 && areaData.some((d) => areaSeries.some((s) => (d[s.key] || 0) > 0)) && (
              <StackedAreaChartRecharts data={areaData} series={areaSeries} height={180} />
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {barData.length > 0 && (
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={barData} margin={{ left: 4, right: 8 }}>
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis width={24} tick={{ fontSize: 10 }} />
                    <Tooltip />
                    {barSeries.map((s, i) => (
                      <Bar
                        key={s.key}
                        dataKey={s.key}
                        name={s.label}
                        stackId="1"
                        fill={s.color}
                        radius={i === barSeries.length - 1 ? [4, 4, 0, 0] : 0}
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              )}
              {pieData.length > 0 && (
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={60}
                      paddingAngle={2}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        ))}
      </section>

      {filteredHabits.length === 0 && (
        <p className="text-text-muted">No hay hábitos con este filtro.</p>
      )}
    </div>
  )
}
