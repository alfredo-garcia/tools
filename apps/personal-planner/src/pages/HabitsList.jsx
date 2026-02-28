import { useState, useEffect, useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useApi, Spinner, PageHeader, AreaChart } from '@tools/shared'
import { field, str, dateStr } from '@tools/shared'
import { isThisWeek, isThisMonth, isInLastDays, getTodayStr, getDaysAgoStr } from '@tools/shared'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Legend } from 'recharts'

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

  const categoriesWithHabits = useMemo(() => getHabitsByCategory(filteredHabits), [filteredHabits])

  const categorySections = useMemo(() => {
    return categoriesWithHabits.map(([categoryName, habitsInCategory]) => {
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
      const areaDataByHabit = {
        data: Object.values(dayCount).sort((a, b) => a.date.localeCompare(b.date)),
        series: habitsInCategory.map((h, i) => ({
          key: str(field(h, 'Habit Name', 'Habit Name')) || h.id,
          label: (str(field(h, 'Habit Name', 'Habit Name')) || h.id).slice(0, 20),
          color: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
        })),
      }

      const donutData = habitsInCategory.map((h, i) => {
        const name = str(field(h, 'Habit Name', 'Habit Name')) || h.id
        const count = trackingCatSuccess.filter((t) => getHabitId(t) === h.id).length
        return { name: name.slice(0, 18), value: count, fill: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }
      }).filter((d) => d.value > 0)

      const barHabitAvg = habitsInCategory.map((h) => {
        const count = trackingCatSuccess.filter((t) => getHabitId(t) === h.id).length
        const avg = chartRangeDays > 0 ? count / chartRangeDays : 0
        return { habit: (str(field(h, 'Habit Name', 'Habit Name')) || h.id).slice(0, 24), avg: Math.round(avg * 100) / 100 }
      })

      return { categoryName, areaDataByHabit, donutData, barHabitAvg }
    })
  }, [categoriesWithHabits, trackingInRange, chartStart, today, chartRangeDays])

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
          <AreaChart
            data={areaChartDataByCategory.data}
            series={areaChartDataByCategory.series.map((s, i) => ({ ...s, color: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }))}
            height={240}
            className="max-w-3xl"
          />
        </section>
      )}

      {categorySections.map(({ categoryName, areaDataByHabit, donutData, barHabitAvg }) => (
        <section key={categoryName} className="rounded-2xl border border-2 border-border bg-surface p-5 space-y-4">
          <h2 className="text-lg font-semibold text-text">{categoryName}</h2>

          {areaDataByHabit.series.length > 0 && areaDataByHabit.data.some((d) => areaDataByHabit.series.some((s) => (d[s.key] || 0) > 0)) && (
            <div>
              <h3 className="text-sm font-medium text-text-muted mb-2">Gráfico de área (hábitos)</h3>
              <AreaChart data={areaDataByHabit.data} series={areaDataByHabit.series} height={200} className="max-w-2xl" />
            </div>
          )}

          {donutData.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-text-muted mb-2">Reparto por hábito</h3>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={donutData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          {barHabitAvg.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-text-muted mb-2">Promedio de hits por hábito</h3>
              <ResponsiveContainer width="100%" height={Math.max(120, barHabitAvg.length * 32)}>
                <BarChart data={barHabitAvg} layout="vertical" margin={{ left: 4, right: 24 }}>
                  <XAxis type="number" allowDecimals tick={{ fontSize: 10 }} />
                  <YAxis type="category" dataKey="habit" width={120} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v) => [v, 'Promedio/día']} />
                  <Bar dataKey="avg" radius={[0, 4, 4, 0]} fill="#f97316" name="Promedio" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>
      ))}

      <section>
        <h2 className="text-base font-semibold text-text mb-3">Hábitos</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {(() => {
            const mid = Math.ceil(filteredHabits.length / 2)
            const col1 = filteredHabits.slice(0, mid)
            const col2 = filteredHabits.slice(mid)
            return (
              <>
                <div className="space-y-3">
                  {col1.map((h) => (
                    <Link
                      key={h.id}
                      to={`/habits/${h.id}`}
                      className="block rounded-xl border border-2 border-border bg-surface p-4 hover:shadow-md transition-shadow"
                    >
                      <span className="font-medium text-text">
                        {str(field(h, 'Habit Name', 'Habit Name')) || '(untitled)'}
                      </span>
                      <div className="flex flex-wrap gap-2 mt-2 text-sm text-text-muted">
                        <span>{str(field(h, 'Category', 'Category'))}</span>
                        <span>Frecuencia: {str(field(h, 'Frequency', 'Frequency')) || '—'}</span>
                      </div>
                    </Link>
                  ))}
                </div>
                <div className="space-y-3">
                  {col2.map((h) => (
                    <Link
                      key={h.id}
                      to={`/habits/${h.id}`}
                      className="block rounded-xl border border-2 border-border bg-surface p-4 hover:shadow-md transition-shadow"
                    >
                      <span className="font-medium text-text">
                        {str(field(h, 'Habit Name', 'Habit Name')) || '(untitled)'}
                      </span>
                      <div className="flex flex-wrap gap-2 mt-2 text-sm text-text-muted">
                        <span>{str(field(h, 'Category', 'Category'))}</span>
                        <span>Frecuencia: {str(field(h, 'Frequency', 'Frequency')) || '—'}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </>
            )
          })()}
        </div>
      </section>

      {filteredHabits.length === 0 && (
        <p className="text-text-muted">No hay hábitos con este filtro.</p>
      )}
    </div>
  )
}
