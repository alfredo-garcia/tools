import { useRef, useCallback, useEffect } from 'react'

const LONG_PRESS_MS = 400

/**
 * Find drop zone element at point (walk up from elementAtPoint).
 * Returns { dayStr } for task zones (data-drop-zone="task") or { dayStr, mealType } for meal zones (data-drop-zone="meal").
 */
function getDropTargetAt(clientX, clientY) {
  if (typeof document === 'undefined') return null
  const el = document.elementFromPoint(clientX, clientY)
  if (!el) return null
  let node = el
  while (node && node !== document.body) {
    const zone = node.getAttribute?.('data-drop-zone')
    if (zone === 'task') {
      const dayStr = node.getAttribute?.('data-day-str')
      if (dayStr) return { dayStr }
    }
    if (zone === 'meal') {
      const dayStr = node.getAttribute?.('data-day-str')
      const mealType = node.getAttribute?.('data-meal-type')
      if (dayStr && mealType) return { dayStr, mealType }
    }
    node = node.parentElement
  }
  return null
}

/**
 * Hook to enable touch-based drag and drop on mobile (long-press to start drag, move finger to target, release to drop).
 * Use the returned handlers on the draggable element. Mark drop zones with data-drop-zone="task" data-day-str={dayStr}
 * or data-drop-zone="meal" data-day-str={dayStr} data-meal-type={mealType}.
 *
 * @param {object} opts
 * @param {() => object} opts.getPayload - Return { taskId, fromDayStr } or { mealId, fromDateStr, fromMealType }
 * @param {(target: { dayStr: string } | { dayStr: string, mealType: string } | null) => void} opts.onDropTarget - Called on touchend with the drop zone under the finger (or null)
 * @param {(boolean) => void} opts.setDragging - Called when touch drag starts/ends
 * @param {(target: object | null) => void} opts.setDragOverTarget - Called when the element under the finger changes (for highlight). Same shape as onDropTarget.
 */
export function useTouchDrag({ getPayload, onDropTarget, setDragging, setDragOverTarget }) {
  const longPressTimer = useRef(null)
  const touchDragging = useRef(false)
  const lastTarget = useRef(null)
  const payloadRef = useRef(null)

  const clearTimer = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
  }, [])

  const onTouchStart = useCallback(
    (e) => {
      if (e.touches.length !== 1) return
      clearTimer()
      payloadRef.current = getPayload()
      touchDragging.current = false
      lastTarget.current = null
      longPressTimer.current = setTimeout(() => {
        longPressTimer.current = null
        touchDragging.current = true
        setDragging(true)
      }, LONG_PRESS_MS)
    },
    [getPayload, setDragging, clearTimer]
  )

  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const opts = { passive: false }
    const onMove = (e) => {
      if (e.touches.length !== 1) return
      if (touchDragging.current) {
        e.preventDefault()
        const t = e.touches[0]
        const target = getDropTargetAt(t.clientX, t.clientY)
        if (target !== lastTarget.current) {
          lastTarget.current = target
          setDragOverTarget(target)
        }
      } else {
        clearTimer()
      }
    }
    const onEnd = (e) => {
      clearTimer()
      if (touchDragging.current) {
        e.preventDefault()
        const target = lastTarget.current
        touchDragging.current = false
        setDragging(false)
        setDragOverTarget(null)
        lastTarget.current = null
        if (target && payloadRef.current) {
          onDropTarget(target)
        }
      }
      payloadRef.current = null
    }
    const onCancel = () => {
      clearTimer()
      if (touchDragging.current) {
        touchDragging.current = false
        setDragging(false)
        setDragOverTarget(null)
      }
      lastTarget.current = null
      payloadRef.current = null
    }
    el.addEventListener('touchmove', onMove, opts)
    el.addEventListener('touchend', onEnd, opts)
    el.addEventListener('touchcancel', onCancel, opts)
    return () => {
      el.removeEventListener('touchmove', onMove)
      el.removeEventListener('touchend', onEnd)
      el.removeEventListener('touchcancel', onCancel)
    }
  }, [onDropTarget, setDragging, setDragOverTarget, clearTimer])

  return {
    ref,
    onTouchStart,
    onTouchMove: undefined,
    onTouchEnd: undefined,
    onTouchCancel: undefined,
  }
}
