/**
 * Controlled switch/toggle. Use for boolean options (e.g. "Show completed").
 * @param {boolean} checked - Current value
 * @param {function(boolean): void} onChange - Called with new value when toggled
 * @param {string} [label] - Optional label text (e.g. "Show completed")
 * @param {string} [className] - Extra class for the wrapper
 */
export function Switch({ checked, onChange, label, className = '' }) {
  const handleClick = (e) => {
    e.stopPropagation()
    onChange(!checked)
  }

  const handleKeyDown = (e) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault()
      e.stopPropagation()
      onChange(!checked)
    }
  }

  return (
    <label
      className={`inline-flex items-center gap-2 cursor-pointer select-none ${className}`}
      onClick={(e) => e.stopPropagation()}
    >
      <span
        role="switch"
        tabIndex={0}
        aria-checked={checked}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        className={`relative inline-flex h-6 w-10 shrink-0 rounded-full border border-border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/70 focus-visible:ring-offset-2 focus-visible:ring-offset-surface ${
          checked ? 'bg-border/70' : 'bg-surface'
        }`}
      >
        <span
          className={`pointer-events-none absolute top-0.5 left-0.5 inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </span>
      {label && <span className="text-sm text-text">{label}</span>}
    </label>
  )
}
