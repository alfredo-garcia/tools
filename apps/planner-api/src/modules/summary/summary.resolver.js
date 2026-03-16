/**
 * PlannerSummary: aggregated counts for a given week (for dashboard/analytics).
 */
export function summaryResolvers(repos) {
  const tasks = repos.tasks
  const habits = repos.habits
  const meals = repos.meals
  return {
    Query: {
      async plannerSummary(_, { week }) {
        const [taskList, habitList, mealList] = await Promise.all([
          tasks.list(),
          habits.list(),
          meals.list(),
        ])
        const weekStr = String(week).slice(0, 10)
        const mealCount = Array.isArray(mealList) ? mealList.filter((m) => (m.Date || '').slice(0, 10) === weekStr).length : 0
        return {
          week: weekStr,
          taskCount: Array.isArray(taskList) ? taskList.length : 0,
          habitCount: Array.isArray(habitList) ? habitList.length : 0,
          mealsCount: mealCount,
        }
      },
    },
  }
}
