import { useState, useEffect, useCallback, useMemo } from 'react'
import { Spinner, PageHeader, IconBook, IconChevronLeft, IconChevronRight, IconChevronDown, IconChevronUp } from '@tools/shared'
import { field, str, dateStr, getWeekDays, getWeekStart, getWeekdayIndex } from '@tools/shared'
import { usePlannerApi } from '../contexts/PlannerApiContext'
import { getMealsForSlot } from '../lib/mealsUtils'
import { AddMealModal } from '../components/AddMealModal'
import { EditMealModal } from '../components/EditMealModal'

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const MEAL_SLOTS = ['Breakfast', 'Lunch', 'Dinner']

function getOrdinalSuffix(n) {
  const d = n % 10
  const teenth = Math.floor(n / 10) % 10 === 1
  if (teenth) return 'th'
  if (d === 1) return 'st'
  if (d === 2) return 'nd'
  if (d === 3) return 'rd'
  return 'th'
}

function getWeekDaysForOffset(weekOffset) {
  const start = getWeekStart(new Date())
  start.setDate(start.getDate() + weekOffset * 7)
  return getWeekDays(start)
}

function addDays(dateStr, delta) {
  const d = new Date(dateStr + 'T12:00:00')
  d.setDate(d.getDate() + delta)
  return d.toISOString().slice(0, 10)
}

function formatDayDate(dayStr) {
  if (!dayStr) return ''
  const d = new Date(dayStr + 'T12:00:00')
  const day = d.getDate()
  return `${MONTH_NAMES[d.getMonth()]} ${day}${getOrdinalSuffix(day)}`
}

const DRAG_TYPE_MEAL = 'application/x-planner-meal'

function MealSlotCard({ meal, recipeName, isDragging, onDragStart, onDragEnd, onClick }) {
  return (
    <div
      role="button"
      tabIndex={0}
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick()
        }
      }}
      className={`rounded-xl bg-surface border border-border p-3 cursor-grab active:cursor-grabbing hover:ring-2 hover:ring-primary/30 transition-shadow ${isDragging ? 'opacity-50' : ''}`}
      aria-label={`Meal: ${recipeName}. Click to edit, drag to move.`}
    >
      <div className="flex items-center gap-2 min-w-0">
        <IconBook size={18} className="shrink-0 text-text-muted" />
        <span className="font-medium text-text truncate">{recipeName || '(sin nombre)'}</span>
      </div>
    </div>
  )
}

function AddSlotButton({ onClick, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full min-h-[52px] rounded-xl bg-transparent border border-background hover:bg-border/30 text-text-muted hover:text-text flex items-center justify-center gap-1 transition-colors"
      aria-label={`Add meal for ${label}`}
    >
      <span className="text-2xl leading-none">+</span>
    </button>
  )
}

/** Una celda: un día + un tipo de comida (drop zone + cards + add). */
function MealSlotCell({
  dayStr,
  dayIndex,
  mealType,
  meals,
  recipesById,
  onMealMove,
  onAddMeal,
  onEditMeal,
  dragOverSlot,
  onDragOverSlot,
  onDragLeaveSlot,
  draggingMealId,
  setDraggingMealId,
}) {
  const dayLabel = DAY_NAMES[dayIndex]
  const dragKey = `${dayStr}-${mealType}`
  const isDragOver = dragOverSlot === dragKey
  const slotMeals = getMealsForSlot(meals, dayStr, mealType)

  const handleDrop = (e) => {
    e.preventDefault()
    onDragOverSlot(null)
    const raw = e.dataTransfer.getData(DRAG_TYPE_MEAL)
    if (!raw || !onMealMove) return
    try {
      const { mealId, fromDateStr, fromMealType } = JSON.parse(raw)
      if (fromDateStr !== dayStr || fromMealType !== mealType) {
        onMealMove(mealId, dayStr, mealType)
      }
    } catch (_) {}
  }

  return (
    <div
      className={`flex flex-col min-w-0 px-2 rounded-lg transition-colors min-h-[80px] ${isDragOver ? 'ring-2 ring-primary bg-primary/5' : ''}`}
      onDragOver={(e) => {
        e.preventDefault()
        e.dataTransfer.dropEffect = 'move'
        onDragOverSlot(dragKey)
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) onDragLeaveSlot()
      }}
      onDrop={handleDrop}
    >
      <div className="space-y-2 w-full mt-0">
        {slotMeals.map((meal) => {
          const recipeId = field(meal, 'Meal', 'Recipe')
          const recipeName = recipeId ? (recipesById[recipeId] || recipeId) : '(sin receta)'
          return (
            <MealSlotCard
              key={meal.id}
              meal={meal}
              recipeName={recipeName}
              isDragging={draggingMealId === meal.id}
              onDragStart={(e) => {
                e.dataTransfer.setData(DRAG_TYPE_MEAL, JSON.stringify({
                  mealId: meal.id,
                  fromDateStr: dayStr,
                  fromMealType: mealType,
                }))
                e.dataTransfer.effectAllowed = 'move'
                setDraggingMealId(meal.id)
              }}
              onDragEnd={() => setTimeout(() => setDraggingMealId(null), 100)}
              onClick={() => onEditMeal(meal, dayStr, mealType, recipeName)}
            />
          )
        })}
        <AddSlotButton onClick={() => onAddMeal(dayStr, mealType)} label={`${dayLabel} ${mealType}`} />
      </div>
    </div>
  )
}

function DayMealsColumn({
  dayStr,
  dayIndex,
  meals,
  recipesById,
  onMealMove,
  onAddMeal,
  onEditMeal,
  dragOverSlot,
  onDragOverSlot,
  onDragLeaveSlot,
  draggingMealId,
  setDraggingMealId,
  hideDayHeader = false,
}) {
  const dayLabel = DAY_NAMES[dayIndex]

  const handleDrop = (e, targetDateStr, targetMealType) => {
    e.preventDefault()
    onDragOverSlot(null)
    const raw = e.dataTransfer.getData(DRAG_TYPE_MEAL)
    if (!raw || !onMealMove) return
    try {
      const { mealId, fromDateStr, fromMealType } = JSON.parse(raw)
      if (fromDateStr !== targetDateStr || fromMealType !== targetMealType) {
        onMealMove(mealId, targetDateStr, targetMealType)
      }
    } catch (_) {}
  }

  return (
    <div className="flex flex-col min-w-0 overflow-y-auto overflow-x-hidden px-2">
      {!hideDayHeader && (
        <div className="py-2 shrink-0">
          <div className="font-bold text-text">{dayLabel}</div>
          <div className="text-sm text-text-muted">{formatDayDate(dayStr)}</div>
        </div>
      )}
      {MEAL_SLOTS.map((mealType) => {
        const slotMeals = getMealsForSlot(meals, dayStr, mealType)
        const dragKey = `${dayStr}-${mealType}`
        const isDragOver = dragOverSlot === dragKey
        return (
          <div
            key={mealType}
            className={`mt-3 rounded-lg min-h-[52px] transition-colors ${isDragOver ? 'ring-2 ring-primary bg-primary/5' : ''}`}
            onDragOver={(e) => {
              e.preventDefault()
              e.dataTransfer.dropEffect = 'move'
              onDragOverSlot(dragKey)
            }}
            onDragLeave={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget)) onDragLeaveSlot()
            }}
            onDrop={(e) => handleDrop(e, dayStr, mealType)}
          >
            <div className="text-xs font-medium text-text-muted mb-1 px-0.5">{mealType}</div>
            <div className="space-y-2">
              {slotMeals.map((meal) => {
                const recipeId = field(meal, 'Meal', 'Recipe')
                const recipeName = recipeId ? (recipesById[recipeId] || recipeId) : '(sin receta)'
                return (
                  <MealSlotCard
                    key={meal.id}
                    meal={meal}
                    recipeName={recipeName}
                    isDragging={draggingMealId === meal.id}
                    onDragStart={(e) => {
                      e.dataTransfer.setData(DRAG_TYPE_MEAL, JSON.stringify({
                        mealId: meal.id,
                        fromDateStr: dayStr,
                        fromMealType: mealType,
                      }))
                      e.dataTransfer.effectAllowed = 'move'
                      setDraggingMealId(meal.id)
                    }}
                    onDragEnd={() => setTimeout(() => setDraggingMealId(null), 100)}
                    onClick={() => onEditMeal(meal, dayStr, mealType, recipeName)}
                  />
                )
              })}
              <AddSlotButton onClick={() => onAddMeal(dayStr, mealType)} label={`${dayLabel} ${mealType}`} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function MealsPage() {
  const { fetchApi, invalidateCache } = usePlannerApi()
  const [meals, setMeals] = useState([])
  const [recipes, setRecipes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [weekOffset, setWeekOffset] = useState(0)
  const [dragOverSlot, setDragOverSlot] = useState(null)
  const [draggingMealId, setDraggingMealId] = useState(null)
  const [addModal, setAddModal] = useState(null)
  const [editModal, setEditModal] = useState(null)
  const [mobileDateStr, setMobileDateStr] = useState(() => {
    const start = getWeekStart(new Date())
    return start.getFullYear() + '-' + String(start.getMonth() + 1).padStart(2, '0') + '-' + String(start.getDate()).padStart(2, '0')
  })
  const [rowCollapsed, setRowCollapsed] = useState({ Breakfast: false, Lunch: false, Dinner: false })

  const recipesById = useMemo(() => {
    const map = {}
    for (const r of recipes) {
      const name = str(field(r, 'Name')) || str(field(r, 'Name ES')) || '(untitled)'
      map[r.id] = name
    }
    return map
  }, [recipes])

  const refetch = useCallback(() => {
    setLoading(true)
    setError(null)
    return Promise.all([
      fetchApi('/api/meals').then((r) => r.data || []),
      fetchApi('/api/recipes').then((r) => r.data || []),
    ])
      .then(([mealsData, recipesData]) => {
        setMeals(mealsData)
        setRecipes(recipesData)
      })
      .catch((e) => {
        setError(e.message)
        throw e
      })
      .finally(() => setLoading(false))
  }, [fetchApi])

  const handleRefresh = useCallback(() => {
    invalidateCache('/api/meals')
    invalidateCache('/api/recipes')
    refetch()
  }, [invalidateCache, refetch])

  useEffect(() => {
    refetch()
  }, [refetch])

  const handleMealMove = useCallback(
    async (mealId, newDateStr, newMealType) => {
      try {
        await fetchApi(`/api/meals/${mealId}`, {
          method: 'PATCH',
          body: JSON.stringify({ Date: newDateStr, 'Meal Type': newMealType }),
        })
        await refetch()
      } catch (err) {
        console.error(err)
      }
    },
    [fetchApi, refetch]
  )

  const weekDays = getWeekDaysForOffset(weekOffset)
  const mobileDayIndex = getWeekdayIndex(mobileDateStr)

  if (loading && meals.length === 0 && recipes.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader breadcrumbs={[{ label: 'Planner', to: '/' }, { label: 'Meals', to: '/meals' }]} />
        <div className="rounded-2xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-6">
          <p className="text-red-700 dark:text-red-300">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={[{ label: 'Planner', to: '/' }, { label: 'Meals', to: '/meals' }]}
        onRefresh={handleRefresh}
        loading={loading}
      />

      {/* Desktop: mismo layout que Planner — grid 7 columnas, flechas en primera/última celda, secciones colapsables sin hover raro */}
      <div className="hidden md:block space-y-0">
        <div className="grid grid-cols-7 gap-3 border-b border-border pb-3 items-stretch">
          {weekDays.map((dayStr, i) => (
            <div key={dayStr} className="flex items-center gap-1 min-w-0">
              {i === 0 && (
                <button
                  type="button"
                  onClick={() => setWeekOffset((o) => o - 1)}
                  aria-label="Previous week"
                  className="shrink-0 p-1.5 rounded-lg text-text-muted hover:bg-border hover:text-text"
                >
                  <IconChevronLeft size={20} />
                </button>
              )}
              <div className="flex-1 min-w-0 py-2 px-2">
                <div className="font-bold text-text truncate">{DAY_NAMES[i]}</div>
                <div className="text-sm text-text-muted">{formatDayDate(dayStr)}</div>
              </div>
              {i === 6 && (
                <button
                  type="button"
                  onClick={() => setWeekOffset((o) => o + 1)}
                  aria-label="Next week"
                  className="shrink-0 p-1.5 rounded-lg text-text-muted hover:bg-border hover:text-text"
                >
                  <IconChevronRight size={20} />
                </button>
              )}
            </div>
          ))}
        </div>
        {MEAL_SLOTS.map((mealType) => {
          const collapsed = rowCollapsed[mealType]
          const setCollapsed = (value) => setRowCollapsed((prev) => ({ ...prev, [mealType]: value }))
          return (
            <div key={mealType} className="mt-4">
              <button
                type="button"
                onClick={() => setCollapsed(!collapsed)}
                className="w-full flex items-center justify-between gap-3 py-2 text-left font-semibold text-base text-text"
                aria-expanded={!collapsed}
              >
                <span>{mealType}</span>
                <span className="flex items-center gap-3 shrink-0">
                  {collapsed ? <IconChevronDown size={22} /> : <IconChevronUp size={22} />}
                </span>
              </button>
              {!collapsed && (
                <div className="grid grid-cols-7 gap-3 mt-2 min-h-[80px]">
                  {weekDays.map((dayStr, i) => (
                    <MealSlotCell
                      key={dayStr}
                      dayStr={dayStr}
                      dayIndex={i}
                      mealType={mealType}
                      meals={meals}
                      recipesById={recipesById}
                      onMealMove={handleMealMove}
                      onAddMeal={(dateStr, type) => setAddModal({ dateStr, mealType: type })}
                      onEditMeal={(meal, dateStr, type, recipeName) =>
                        setEditModal({ meal, dateStr, mealType: type, recipeName })
                      }
                      dragOverSlot={dragOverSlot}
                      onDragOverSlot={setDragOverSlot}
                      onDragLeaveSlot={() => setDragOverSlot(null)}
                      draggingMealId={draggingMealId}
                      setDraggingMealId={setDraggingMealId}
                    />
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Mobile: un día por vista con flechas para cambiar de día */}
      <div className="md:hidden">
        <div className="flex items-center justify-between gap-2 mb-3">
          <button
            type="button"
            aria-label="Previous day"
            onClick={() => setMobileDateStr((d) => addDays(d, -1))}
            className="min-h-[44px] min-w-[44px] rounded-xl border-2 border-border bg-surface text-text flex items-center justify-center shrink-0"
          >
            <IconChevronLeft size={22} />
          </button>
          <span className="font-semibold text-text truncate text-center">
            {mobileDayIndex >= 0 && mobileDayIndex < DAY_NAMES.length
              ? `${DAY_NAMES[mobileDayIndex]} ${formatDayDate(mobileDateStr)}`
              : formatDayDate(mobileDateStr)}
          </span>
          <button
            type="button"
            aria-label="Next day"
            onClick={() => setMobileDateStr((d) => addDays(d, 1))}
            className="min-h-[44px] min-w-[44px] rounded-xl border-2 border-border bg-surface text-text flex items-center justify-center shrink-0"
          >
            <IconChevronRight size={22} />
          </button>
        </div>
        <div className="overflow-hidden touch-pan-y">
          <DayMealsColumn
            key={mobileDateStr}
            dayStr={mobileDateStr}
            dayIndex={mobileDayIndex >= 0 ? mobileDayIndex : 0}
            meals={meals}
            recipesById={recipesById}
            onMealMove={handleMealMove}
            onAddMeal={(dateStr, mealType) => setAddModal({ dateStr, mealType })}
            onEditMeal={(meal, dateStr, mealType, recipeName) =>
              setEditModal({ meal, dateStr, mealType, recipeName })
            }
            dragOverSlot={dragOverSlot}
            onDragOverSlot={setDragOverSlot}
            onDragLeaveSlot={() => setDragOverSlot(null)}
            draggingMealId={draggingMealId}
            setDraggingMealId={setDraggingMealId}
            hideDayHeader
          />
        </div>
      </div>

      {addModal && (
        <AddMealModal
          dateStr={addModal.dateStr}
          mealType={addModal.mealType}
          onClose={() => setAddModal(null)}
          onAdded={refetch}
        />
      )}
      {editModal && (
        <EditMealModal
          meal={editModal.meal}
          dateStr={editModal.dateStr}
          mealType={editModal.mealType}
          recipeName={editModal.recipeName}
          onClose={() => setEditModal(null)}
          onUpdated={refetch}
          onDeleted={refetch}
        />
      )}
    </div>
  )
}
