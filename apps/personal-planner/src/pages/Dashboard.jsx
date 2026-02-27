import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useApi, Spinner, PageHeader } from '@tools/shared'
import { field, num, str, arr, dateStr } from '@tools/shared'
import { isToday, isThisWeek, isPastDue, isInNextDays, getWeekStart } from '@tools/shared'
import { getTaskStatusGroup } from '../lib/taskStatus'
import { getCurrentStreak, getLongestStreak } from '../lib/habitStreaks'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'

const STATUS_DONE = ['Done', 'Complete', 'Completado', 'Hecho', 'Cerrado']

function weekKey(d) {
  if (!d) return ''
  const start = getWeekStart(d)
  const y = start.getFullYear()
  const m = String(start.getMonth() + 1).padStart(2, '0')
  const day = String(start.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function isHabitSuccess(t) {
  const v = field(t, 'Was Successful?', 'Was Successful')
  return v === true || str(v).toLowerCase() === 'yes' || str(v) === '1'
}

function useDashboardData() {
  const { fetchApi } = useApi()
  const [data, setData] = useState({
    objectives: [],
    keyResults: [],
    tasks: [],
    habits: [],
    habitTracking: [],
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const refetch = useCallback(() => {
    setLoading(true)
    setError(null)
    Promise.all([
      fetchApi('/api/objectives').then((r) => r.data),
      fetchApi('/api/key-results').then((r) => r.data),
      fetchApi('/api/tasks').then((r) => r.data),
      fetchApi('/api/habits').then((r) => r.data),
      fetchApi('/api/habit-tracking').then((r) => r.data),
    ])
      .then(([objectives, keyResults, tasks, habits, habitTracking]) => {
        setData({ objectives, keyResults, tasks, habits, habitTracking })
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [fetchApi])

  useEffect(() => {
    refetch()
  }, [refetch])

  return { data, loading, error, refetch }
}

function KpiCard({ title, value, subtitle, to, variant }) {
  const borderClass =
    variant === 'danger'
      ? 'border-red-300 dark:border-red-700'
      : 'border-border'
  return (
    <Link
      to={to || '#'}
      className={`rounded-2xl border border-2 ${borderClass} bg-surface p-5 shadow-sm hover:shadow-md transition-shadow ${
        to ? 'cursor-pointer' : 'cursor-default'
      }`}
    >
      <p className="text-sm font-medium text-text-muted">{title}</p>
      <p className="mt-1 text-2xl font-bold text-text">{value}</p>
      {subtitle != null && (
        <p className="mt-0.5 text-sm text-text-muted">{subtitle}</p>
      )}
    </Link>
  )
}

export function Dashboard() {
  const { data, loading, error, refetch } = useDashboardData()

  if (loading && !data.objectives?.length) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    )
  }
  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-6">
        <p className="text-red-700 dark:text-red-300">{error}</p>
      </div>
    )
  }

  const { objectives, keyResults, tasks, habits, habitTracking } = data

  // —— OKR metrics ——
  const krProgress = keyResults.map((kr) => {
    const p = num(field(kr, 'Progress (%)', 'Progress', 'Progress %')) ?? 0
    return typeof p === 'number' ? p : parseFloat(p) || 0
  })
  const okrPct =
    krProgress.length === 0
      ? 0
      : Math.round(krProgress.reduce((a, b) => a + b, 0) / krProgress.length)
  const krDone = keyResults.filter((kr) =>
    STATUS_DONE.includes(str(field(kr, 'Status', 'status')))
  ).length
  const krTotal = keyResults.length
  const krPct = krTotal === 0 ? 0 : Math.round((krDone / krTotal) * 100)

  // Progress by objective (like AnalysisOKR)
  const krByObjective = objectives
    .map((o) => {
      const krs = keyResults.filter((kr) => {
        const link = arr(field(kr, 'Objective Link', 'Objective'))
        return link.includes(o.id)
      })
      const progressList = krs.map(
        (kr) => num(field(kr, 'Progress (%)', 'Progress', 'Progress %')) ?? 0
      )
      const avg =
        progressList.length
          ? progressList.reduce((a, b) => a + b, 0) / progressList.length
          : 0
      const done = krs.filter((kr) =>
        STATUS_DONE.includes(str(field(kr, 'Status', 'Status')))
      ).length
      const targetDateStr = dateStr(field(o, 'Target Date', 'Target Date'))
      return {
        id: o.id,
        name: str(field(o, 'Objective Name', 'Objective Name')).slice(0, 24) || 'Objective',
        avgProgress: Math.round(avg),
        totalKR: krs.length,
        doneKR: done,
        targetDateStr,
      }
    })
    .filter((x) => x.totalKR > 0 || x.name !== 'Objective')

  // Objectives at risk: target in next 14 days and avg progress < 50%
  const now = new Date()
  const in14Days = new Date(now)
  in14Days.setDate(in14Days.getDate() + 14)
  const objectivesAtRisk = krByObjective.filter((o) => {
    if (!o.targetDateStr || o.avgProgress >= 50) return false
    const target = new Date(o.targetDateStr)
    return target >= now && target <= in14Days
  })

  // —— Tasks: not done only for "challenges ahead" ——
  const getDue = (t) => dateStr(field(t, 'Due Date', 'Due Date'))
  const isDone = (t) => STATUS_DONE.includes(str(field(t, 'Status', 'status')))
  const tasksNotDone = tasks.filter((t) => !isDone(t))
  const tasksPastDue = tasksNotDone.filter((t) => isPastDue(getDue(t)))
  const tasksToday = tasksNotDone.filter((t) => isToday(getDue(t)))
  const tasksThisWeek = tasksNotDone.filter((t) => isThisWeek(getDue(t)))
  const tasksNext30 = tasksNotDone.filter((t) => isInNextDays(getDue(t), 30))

  // Next 5 tasks: sort by due date (past first, then today, then future), take 5
  const sortedForList = [...tasksNotDone].sort((a, b) => {
    const da = getDue(a) || '9999-12-31'
    const db = getDue(b) || '9999-12-31'
    return da.localeCompare(db)
  })
  const nextTasksList = sortedForList.slice(0, 5)

  // Weekly completion (for pie)
  const weekTasks = tasks.filter((t) => isThisWeek(getDue(t)))
  const weekTasksDone = weekTasks.filter((t) => isDone(t))
  const todosPct =
    weekTasks.length === 0
      ? 0
      : Math.round((weekTasksDone.length / weekTasks.length) * 100)

  // —— Habits ——
  const thisWeekTracking = habitTracking.filter((t) =>
    isThisWeek(dateStr(field(t, 'Execution Date-Time', 'Execution Date-Time', 'Execution Date')))
  )
  const habitSuccess = thisWeekTracking.filter(isHabitSuccess).length
  const habitsPct =
    thisWeekTracking.length === 0
      ? 0
      : Math.round((habitSuccess / thisWeekTracking.length) * 100)

  // Trend: last 4 weeks success %
  const byWeek = {}
  habitTracking.forEach((t) => {
    const d = dateStr(field(t, 'Execution Date-Time', 'Execution Date-Time', 'Execution Date'))
    if (!d) return
    const w = weekKey(d)
    if (!byWeek[w]) byWeek[w] = { week: w, total: 0, success: 0 }
    byWeek[w].total += 1
    if (isHabitSuccess(t)) byWeek[w].success += 1
  })
  const habitWeekData = Object.values(byWeek)
    .sort((a, b) => a.week.localeCompare(b.week))
    .slice(-4)
    .map((x) => ({
      ...x,
      name: x.week.slice(5) || x.week,
      pct: x.total ? Math.round((x.success / x.total) * 100) : 0,
    }))
  const avgHabitPctLast4 =
    habitWeekData.length === 0
      ? 0
      : Math.round(
          habitWeekData.reduce((a, x) => a + x.pct, 0) / habitWeekData.length
        )

  // Streaks per habit (top 5 by current streak for display)
  const habitsWithStreaks = habits.map((h) => ({
    id: h.id,
    name: str(field(h, 'Habit Name', 'Habit Name')) || 'Habit',
    current: getCurrentStreak(h.id, habitTracking),
    longest: getLongestStreak(h.id, habitTracking),
  }))
  const topHabitsByStreak = [...habitsWithStreaks]
    .filter((x) => x.current > 0 || x.longest > 0)
    .sort((a, b) => b.current - a.current)
    .slice(0, 5)

  // —— Charts data ——
  const okrChartData = keyResults.slice(0, 8).map((kr) => ({
    name: str(field(kr, 'Key Result Name', 'Key Result Name')).slice(0, 12) || 'KR',
    progress: num(field(kr, 'Progress (%)', 'Progress', 'Progress %')) ?? 0,
  }))
  const statusPie = [
    { name: 'Completed', value: weekTasksDone.length, color: '#f97316' },
    { name: 'To do', value: weekTasks.length - weekTasksDone.length, color: '#737373' },
  ].filter((d) => d.value > 0)

  return (
    <div className="space-y-8">
      <PageHeader
        breadcrumbs={[{ label: 'Home', to: '/' }]}
        onRefresh={refetch}
        loading={loading}
      />

      {/* 1. KPI summary */}
      <section>
        <h2 className="text-base font-semibold text-text-muted mb-4">
          Completion summary
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            title="OKR (media KR)"
            value={`${okrPct}%`}
            subtitle={`${objectives.length} objectives, ${keyResults.length} key results`}
            to="/analysis/okr"
          />
          <KpiCard
            title="Key Results"
            value={`${krPct}%`}
            subtitle={`${krDone} / ${krTotal} completed`}
            to="/key-results"
          />
          <KpiCard
            title="Weekly to-dos"
            value={`${todosPct}%`}
            subtitle={`${weekTasksDone.length} / ${weekTasks.length} this week`}
            to="/analysis/tasks"
          />
          <KpiCard
            title="Habits (this week)"
            value={`${habitsPct}%`}
            subtitle={`${habitSuccess} / ${thisWeekTracking.length} successful logs`}
            to="/analysis/habits"
          />
        </div>
      </section>

      {/* 2. Objectives: progress by objective + at risk */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-2 border-border bg-surface p-5">
          <h3 className="text-base font-semibold text-text mb-4">
            Progress by objective
          </h3>
          {krByObjective.length === 0 ? (
            <p className="text-text-muted text-sm">No objectives with key results yet.</p>
          ) : (
            <ul className="space-y-2 max-h-64 overflow-y-auto">
              {krByObjective.map((o) => (
                <li key={o.id}>
                  <Link
                    to={`/objectives/${o.id}`}
                    className="flex items-center justify-between gap-2 rounded-xl border border-border bg-surface p-3 hover:shadow-md text-left"
                  >
                    <span className="text-sm font-medium text-text truncate flex-1">
                      {o.name}
                    </span>
                    <span className="text-sm text-text-muted shrink-0">
                      {o.avgProgress}% · {o.doneKR}/{o.totalKR} KR
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <Link
            to="/analysis/okr"
            className="mt-3 inline-block text-sm text-primary hover:underline"
          >
            View OKR analysis →
          </Link>
        </div>
        <div className="rounded-2xl border border-2 border-border bg-surface p-5">
          <h3 className="text-base font-semibold text-text mb-4">
            Objectives at risk
          </h3>
          <p className="text-sm text-text-muted mb-2">
            Target in next 14 days with progress &lt; 50%
          </p>
          {objectivesAtRisk.length === 0 ? (
            <p className="text-text-muted text-sm">None.</p>
          ) : (
            <ul className="space-y-2">
              {objectivesAtRisk.map((o) => (
                <li key={o.id}>
                  <Link
                    to={`/objectives/${o.id}`}
                    className="block rounded-xl border border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-900/10 p-3 hover:shadow-md"
                  >
                    <span className="text-sm font-medium text-text">{o.name}</span>
                    <span className="text-sm text-text-muted block mt-0.5">
                      {o.avgProgress}% · target {o.targetDateStr}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* 3. Habits: trend + streaks */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-2 border-border bg-surface p-5">
          <h3 className="text-base font-semibold text-text mb-4">
            Habits trend (last 4 weeks)
          </h3>
          {habitWeekData.length === 0 ? (
            <p className="text-text-muted text-sm">No habit tracking data yet.</p>
          ) : (
            <>
              <p className="text-sm text-text-muted mb-2">
                This week: {habitsPct}% · Avg last 4 weeks: {avgHabitPctLast4}%
              </p>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={habitWeekData} margin={{ left: 8, right: 20 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                  <Tooltip formatter={(v) => [`${v}%`, 'Success']} />
                  <Bar dataKey="pct" fill="#f97316" radius={[4, 4, 0, 0]} name="Success %" />
                </BarChart>
              </ResponsiveContainer>
            </>
          )}
          <Link
            to="/analysis/habits"
            className="mt-3 inline-block text-sm text-primary hover:underline"
          >
            View habit analysis →
          </Link>
        </div>
        <div className="rounded-2xl border border-2 border-border bg-surface p-5">
          <h3 className="text-base font-semibold text-text mb-4">
            Habit streaks
          </h3>
          {topHabitsByStreak.length === 0 ? (
            <p className="text-text-muted text-sm">No streaks yet. Log successful habits to build streaks.</p>
          ) : (
            <ul className="space-y-2">
              {topHabitsByStreak.map((h) => (
                <li key={h.id}>
                  <Link
                    to={`/habits/${h.id}`}
                    className="flex items-center justify-between gap-2 rounded-xl border border-border bg-surface p-3 hover:shadow-md"
                  >
                    <span className="text-sm font-medium text-text truncate flex-1">
                      {h.name}
                    </span>
                    <span className="text-sm text-text-muted shrink-0">
                      Current: {h.current} · Best: {h.longest}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <Link
            to="/habits"
            className="mt-3 inline-block text-sm text-primary hover:underline"
          >
            View all habits →
          </Link>
        </div>
      </section>

      {/* 4. Tasks: today / week / 30 days / past due + list */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-2 border-border bg-surface p-5">
          <h3 className="text-base font-semibold text-text mb-4">
            Tasks ahead
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            <KpiCard
              title="Overdue"
              value={tasksPastDue.length}
              subtitle="Past due"
              to="/tasks"
              variant={tasksPastDue.length > 0 ? 'danger' : undefined}
            />
            <KpiCard
              title="Today"
              value={tasksToday.length}
              subtitle="Due today"
              to="/tasks"
            />
            <KpiCard
              title="This week"
              value={tasksThisWeek.length}
              subtitle="Due this week"
              to="/tasks"
            />
            <KpiCard
              title="Next 30 days"
              value={tasksNext30.length}
              subtitle="Due in 30 days"
              to="/tasks"
            />
          </div>
          <h4 className="text-sm font-medium text-text-muted mb-2">
            Next tasks
          </h4>
          {nextTasksList.length === 0 ? (
            <p className="text-text-muted text-sm">No pending tasks.</p>
          ) : (
            <ul className="space-y-1">
              {nextTasksList.map((t) => (
                <li key={t.id}>
                  <Link
                    to={`/tasks/${t.id}`}
                    className="block text-sm rounded-lg py-1.5 px-2 hover:bg-border/50 truncate"
                  >
                    {str(field(t, 'Task Name', 'Task Name')) || '(untitled)'}
                    {getDue(t) && (
                      <span className="text-text-muted ml-2">{getDue(t)}</span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <Link
            to="/tasks"
            className="mt-3 inline-block text-sm text-primary hover:underline"
          >
            View all tasks →
          </Link>
        </div>
        <div className="rounded-2xl border border-2 border-border bg-surface p-5">
          <h3 className="text-base font-semibold text-text mb-4">
            Tasks this week
          </h3>
          {statusPie.length === 0 ? (
            <p className="text-text-muted text-sm">No tasks this week</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={statusPie}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                  nameKey="name"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {statusPie.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>

      {/* 5. Charts: Key Results bar + recent objectives/habits links */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-2 border-border bg-surface p-5">
          <h3 className="text-base font-semibold text-text mb-4">
            Key Results progress (top 8)
          </h3>
          {okrChartData.length === 0 ? (
            <p className="text-text-muted text-sm">No data</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={okrChartData} layout="vertical" margin={{ left: 4, right: 20 }}>
                <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v) => [`${v}%`, 'Progress']} />
                <Bar dataKey="progress" fill="#f97316" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 content-start">
          <Link
            to="/objectives"
            className="rounded-2xl border border-2 border-border bg-surface p-5 hover:shadow-md transition-shadow"
          >
            <h3 className="text-base font-semibold text-text">Recent objectives</h3>
            <p className="text-sm text-text-muted mt-1">
              {objectives.length} objectives · View all
            </p>
            <ul className="mt-3 space-y-1">
              {objectives.slice(0, 3).map((o) => (
                <li key={o.id} className="text-sm text-text-muted truncate">
                  {str(field(o, 'Objective Name', 'Objective Name')) || '(untitled)'}
                </li>
              ))}
            </ul>
          </Link>
          <Link
            to="/habits"
            className="rounded-2xl border border-2 border-border bg-surface p-5 hover:shadow-md transition-shadow"
          >
            <h3 className="text-base font-semibold text-text">Habits</h3>
            <p className="text-sm text-text-muted mt-1">
              {habits.length} habits · View all
            </p>
            <ul className="mt-3 space-y-1">
              {habits.slice(0, 3).map((h) => (
                <li key={h.id} className="text-sm text-text-muted truncate">
                  {str(field(h, 'Habit Name', 'Habit Name')) || '(untitled)'}
                </li>
              ))}
            </ul>
          </Link>
        </div>
      </section>
    </div>
  )
}
