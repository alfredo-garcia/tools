/**
 * Floating Action Button: fixed bottom-right, above bottom nav on mobile.
 * Props: onClick, ariaLabel, optional className.
 */
export function Fab({ onClick, ariaLabel, className = '' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className={`
        fixed z-40 right-4 md:right-8
        bottom-[6rem] md:bottom-8
        w-14 h-14 min-h-[44px] min-w-[44px] rounded-full
        flex items-center justify-center
        bg-primary text-white shadow-lg hover:bg-primary/90 active:scale-95
        transition-colors touch-manipulation
        ${className}
      `.trim()}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={28}
        height={28}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
      </svg>
    </button>
  )
}
