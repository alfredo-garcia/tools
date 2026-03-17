import { useEffect, useRef, useState } from 'react'

/**
 * Modal: overlay + content panel. Closes on overlay click or Escape.
 * En viewports pequeños: se comporta como bottom sheet — anclado abajo, ocupa la mayor parte del viewport.
 * En md y superiores: diálogo centrado.
 * Props: open (boolean), onClose, title (optional), children, ariaLabelledBy (optional), className (optional for panel).
 */
export function Modal({ open, onClose, title, children, ariaLabelledBy, className = '' }) {
  const panelRef = useRef(null)
  const [sheetVisible, setSheetVisible] = useState(false)

  useEffect(() => {
    if (!open) return
    setSheetVisible(false)
    const t = requestAnimationFrame(() => {
      requestAnimationFrame(() => setSheetVisible(true))
    })
    return () => cancelAnimationFrame(t)
  }, [open])

  useEffect(() => {
    if (!open) return
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center md:items-center p-0 md:p-4 bg-black/60"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby={ariaLabelledBy}
    >
      <div
        ref={panelRef}
        className={`
          bg-surface border-2 border-border shadow-xl overflow-hidden flex flex-col
          w-full max-h-[88vh] md:max-h-[90vh] md:max-w-2xl
          rounded-t-2xl rounded-b-none md:rounded-2xl
          transition-transform duration-300 ease-out
          md:translate-y-0
          ${open && sheetVisible ? 'translate-y-0' : 'translate-y-full'}
          ${className}
        `.trim()}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Bottom-sheet handle (solo en viewports pequeños) */}
        <div className="md:hidden flex justify-center pt-2 pb-1 shrink-0" aria-hidden>
          <span className="w-12 h-1 rounded-full bg-border" />
        </div>
        {(title != null && title !== '') && (
          <div className="p-5 pt-0 md:pt-5 border-b border-border flex items-center justify-between gap-3 shrink-0">
            <h2 id={ariaLabelledBy} className="font-bold text-xl text-text">
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 p-2 rounded-lg text-text-muted hover:bg-border text-xl leading-none"
              aria-label="Close"
            >
              ×
            </button>
          </div>
        )}
        <div className="p-5 overflow-y-auto flex-1 min-h-0">{children}</div>
      </div>
    </div>
  )
}
