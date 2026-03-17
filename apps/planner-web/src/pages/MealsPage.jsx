import { useState, useEffect, useCallback } from 'react'
import { Spinner, PageHeader, IconChevronLeft, IconChevronRight } from '@tools/shared'
import { getWeekDays, getWeekStart } from '@tools/shared'
import { usePlannerApi } from '../contexts/PlannerApiContext'
import { AddMealModal } from '../components/AddMealModal'
import { EditMealModal } from '../components/EditMealModal'

const MEALS_QUERY = `
  query { meals { id mealType date meal lastModified } }
`
const RECIPES_QUERY = `
  query { recipes { id name nameES } }
`

function getWeekDaysForOffset(weekOffset) {
  const start = getWeekStart(new Date())
  start.setDate(start.getDate() + weekOffset * 7)
  return getWeekDays(start)
}

const MEAL_SLOTS = ['Breakfast', 'Lunch', 'Dinner']

export function MealsPage() {
  const { graphql } = usePlannerApi()
  const [weekOffset, setWeekOffset] = useState(0)
  const [meals, setMeals] = useState([])
  const [recipes, setRecipes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [addModal, setAddModal] = useState(null)
  const [editMeal, setEditMeal] = useState(null)

  const weekDays = getWeekDaysForOffset(weekOffset)
  const weekLabel = weekDays[0] && weekDays[6] ? `${weekDays[0]} – ${weekDays[6]}` : 'Week'

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [mealsData, recipesData] = await Promise.all([
        graphql(MEALS_QUERY),
        graphql(RECIPES_QUERY),
      ])
      setMeals(mealsData?.meals ?? [])
      setRecipes(recipesData?.recipes ?? [])
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [graphql])

  useEffect(() => {
    load()
  }, [load])

  const recipesById = Object.fromEntries((recipes || []).map((r) => [r.id, r.nameES || r.name || r.id]))

  const getMealsForDaySlot = (dayStr, mealType) =>
    (meals || []).filter(
      (m) => (m.date || '').slice(0, 10) === dayStr && (m.mealType || '') === mealType
    )

  if (loading && meals.length === 0 && recipes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-12">
        <Spinner />
        <p className="text-text-muted">Loading meals…</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Meals" onRefresh={load} loading={loading} />
      <p className="text-sm text-text-muted -mt-4">{weekLabel}</p>
      {error && (
        <p className="text-red-600 dark:text-red-400 text-sm" role="alert">
          {error}
        </p>
      )}
      <div className="mt-4 overflow-x-auto">
        <table className="w-full border-collapse min-w-[600px]">
          <thead>
            <tr className="border-b border-border">
              <th className="w-24 p-2" aria-label="Slot" />
              {weekDays.map((dayStr, i) => (
                <th key={dayStr} className="text-left text-xs font-medium text-text-muted p-2">
                  <span className="flex items-center justify-center gap-1">
                    {i === 0 && (
                      <button
                        type="button"
                        onClick={() => setWeekOffset((o) => o - 1)}
                        aria-label="Previous week"
                        className="shrink-0 p-1 rounded-lg text-text-muted hover:bg-border hover:text-text"
                      >
                        <IconChevronLeft size={18} />
                      </button>
                    )}
                    <span className="truncate">{dayStr}</span>
                    {i === 6 && (
                      <button
                        type="button"
                        onClick={() => setWeekOffset((o) => o + 1)}
                        aria-label="Next week"
                        className="shrink-0 p-1 rounded-lg text-text-muted hover:bg-border hover:text-text"
                      >
                        <IconChevronRight size={18} />
                      </button>
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MEAL_SLOTS.map((slot) => (
              <tr key={slot} className="border-b border-border">
                <td className="p-2 text-sm font-medium text-text">{slot}</td>
                {weekDays.map((dayStr) => {
                  const dayMeals = getMealsForDaySlot(dayStr, slot)
                  return (
                    <td key={`${dayStr}-${slot}`} className="p-2 align-top">
                      <ul className="space-y-1">
                        {dayMeals.map((m) => (
                          <li key={m.id}>
                            <button
                              type="button"
                              onClick={() =>
                                setEditMeal({
                                  meal: m,
                                  dateStr: (m.date || '').slice(0, 10),
                                  mealType: m.mealType,
                                  recipeName: recipesById[m.meal] || m.meal || '(no recipe)',
                                })
                              }
                              className="w-full text-left text-sm text-text rounded bg-surface px-2 py-1 hover:ring-2 hover:ring-primary/30 transition-shadow"
                            >
                              {recipesById[m.meal] || m.meal || '(no recipe)'}
                            </button>
                          </li>
                        ))}
                        <li>
                          <button
                            type="button"
                            onClick={() =>
                              setAddModal({ dateStr: dayStr, mealType: slot })
                            }
                            className="w-full text-sm text-text-muted rounded border border-dashed border-border px-2 py-1 hover:bg-surface hover:text-primary transition-colors"
                            aria-label={`Add meal for ${dayStr} ${slot}`}
                          >
                            +
                          </button>
                        </li>
                      </ul>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {addModal && (
        <AddMealModal
          dateStr={addModal.dateStr}
          mealType={addModal.mealType}
          onClose={() => setAddModal(null)}
          onAdded={load}
        />
      )}
      {editMeal && (
        <EditMealModal
          meal={editMeal.meal}
          dateStr={editMeal.dateStr}
          mealType={editMeal.mealType}
          recipeName={editMeal.recipeName}
          onClose={() => setEditMeal(null)}
          onUpdated={load}
          onDeleted={load}
        />
      )}
    </div>
  )
}
