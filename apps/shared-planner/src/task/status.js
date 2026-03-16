// Task status helpers for planner domain.
// These functions are intentionally UI-agnostic so they can be reused
// from web and mobile front-ends.

// Groups a raw task record into a normalized status bucket.
// Buckets: 'pending' | 'in_progress' | 'done' | 'other'
export function getTaskStatusGroup(task, { fieldAccessor } = {}) {
  const getField =
    fieldAccessor ||
    ((t, ...keys) => {
      for (const k of keys) {
        if (t && Object.prototype.hasOwnProperty.call(t, k)) return t[k]
      }
      return undefined
    })

  const raw =
    (getField(task, 'Status', 'status', 'state') ?? '').toString().trim()
  const value = raw.toLowerCase()

  if (!value) return 'pending'

  if (['done', 'complete', 'completed', 'hecho', 'cerrado'].some((s) => value.includes(s))) {
    return 'done'
  }

  if (
    ['in progress', 'doing', 'wip', 'en curso'].some((s) =>
      value.includes(s)
    )
  ) {
    return 'in_progress'
  }

  if (['todo', 'pending', 'pendiente', 'backlog'].some((s) => value.includes(s))) {
    return 'pending'
  }

  return 'other'
}

// Given a list of tasks, returns counts and percentages per group.
export function getTaskStatusBreakdown(tasks, options) {
  const list = Array.isArray(tasks) ? tasks : []
  const total = list.length

  const groups = {
    pending: 0,
    in_progress: 0,
    done: 0,
    other: 0,
  }

  for (const t of list) {
    const g = getTaskStatusGroup(t, options)
    if (groups[g] == null) {
      groups.other += 1
    } else {
      groups[g] += 1
    }
  }

  const pct = (n) => (total === 0 ? 0 : Math.round((n / total) * 100))

  return {
    total,
    counts: { ...groups },
    percentages: {
      pending: pct(groups.pending),
      in_progress: pct(groups.in_progress),
      done: pct(groups.done),
      other: pct(groups.other),
    },
  }
}

