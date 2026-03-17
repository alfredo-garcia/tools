import { useRef, useCallback, useEffect } from 'react'

const LONG_PRESS_MS = 400

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
    node = node.parentElement
  }
  return null
}

/**
 * Touch-based drag and drop for planner tasks (long-press to drag).
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

  return { ref, onTouchStart }
}
