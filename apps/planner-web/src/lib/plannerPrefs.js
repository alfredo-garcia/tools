const PLANNER_PREFS_KEY = 'planner-web-prefs'

export function readPlannerPrefs() {
  if (typeof window === 'undefined') {
    return {
      showCompleted: false,
      showFullDay: false,
      tasksCollapsed: false,
      eventsCollapsed: false,
      habitsCollapsed: false,
    }
  }
  try {
    const raw = localStorage.getItem(PLANNER_PREFS_KEY)
    if (!raw)
      return {
        showCompleted: false,
        showFullDay: false,
        tasksCollapsed: false,
        eventsCollapsed: false,
        habitsCollapsed: false,
      }
    const p = JSON.parse(raw)
    return {
      showCompleted: Boolean(p.showCompleted),
      showFullDay: Boolean(p.showFullDay),
      tasksCollapsed: Boolean(p.tasksCollapsed),
      eventsCollapsed: Boolean(p.eventsCollapsed),
      habitsCollapsed: Boolean(p.habitsCollapsed),
    }
  } catch (_) {
    return {
      showCompleted: false,
      showFullDay: false,
      tasksCollapsed: false,
      eventsCollapsed: false,
      habitsCollapsed: false,
    }
  }
}

export function writePlannerPrefs(prefs) {
  if (typeof window === 'undefined') return
  try {
    const prev = readPlannerPrefs()
    localStorage.setItem(PLANNER_PREFS_KEY, JSON.stringify({ ...prev, ...prefs }))
  } catch (_) {}
}
