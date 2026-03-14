import { useState, useRef, useEffect, useId } from 'react'
import { IconChevronDown, IconCheckSquare, IconSearch } from './Icons.jsx'

const DEFAULT_SEARCH_THRESHOLD = 8

/**
 * FilterDropdown: card-style trigger that opens a panel with options.
 * - Single-select: value is string; clicking an option calls onChange and closes.
 * - Multi-select: value is string[]; options show checkboxes; "All" when empty; optional search when options.length > searchThreshold.
 *
 * @param {object} props
 * @param {string} props.label - Filter name (e.g. "Category"), used for "All {label}" in multi and a11y.
 * @param {string} props.summary - Text shown on the trigger (e.g. "All categories", "High, Low").
 * @param {Array<{ value: string, label: string }>} props.options - Options to display.
 * @param {string|string[]} props.value - Current value: string for single, string[] for multi (empty = "All").
 * @param {function} props.onChange - (value) => void. Single: (string). Multi: (string[]).
 * @param {boolean} [props.multi=false] - If true, multi-select with checkboxes.
 * @param {number} [props.searchThreshold=8] - Show search input in panel when options.length > this (multi only).
 * @param {React.ReactNode} [props.triggerIcon] - Optional icon left of summary.
 * @param {string} [props.allOptionLabel] - For multi-select, label for the "All" option in the panel (e.g. "All priorities"). Defaults to "All {label}".
 * @param {string} [props.className] - Extra class for the trigger button wrapper.
 *
 * @example
 * // Single-select (Dates)
 * <FilterDropdown label="Dates" summary={dateLabel} options={DATE_OPTIONS} value={dateFilter} onChange={setDateFilter} />
 *
 * @example
 * // Multi-select (Category)
 * <FilterDropdown label="Category" summary={categorySummary} options={categoryOptions} value={categoryFilter} onChange={setCategoryFilter} multi />
 */
export function FilterDropdown({
  label,
  summary,
  options = [],
  value,
  onChange,
  multi = false,
  searchThreshold = DEFAULT_SEARCH_THRESHOLD,
  triggerIcon,
  allOptionLabel,
  className = '',
}) {
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const triggerRef = useRef(null)
  const panelRef = useRef(null)
  const id = useId()
  const panelId = `filter-dropdown-panel-${id.replace(/:/g, '')}`
  const triggerId = `filter-dropdown-trigger-${id.replace(/:/g, '')}`

  const selectedSet = multi ? new Set(Array.isArray(value) ? value : []) : null
  const filteredOptions =
    multi && searchQuery.trim()
      ? options.filter((opt) => opt.label.toLowerCase().includes(searchQuery.trim().toLowerCase()))
      : options

  useEffect(() => {
    if (!open) return
    const handleClickOutside = (e) => {
      if (
        triggerRef.current?.contains(e.target) ||
        panelRef.current?.contains(e.target)
      ) return
      setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  const handleSingleSelect = (optionValue) => {
    onChange(optionValue)
    setOpen(false)
  }

  const handleMultiToggle = (optionValue) => {
    const next = selectedSet.has(optionValue)
      ? [...selectedSet].filter((v) => v !== optionValue)
      : [...selectedSet, optionValue]
    onChange(next)
  }

  const handleMultiSelectAll = () => {
    onChange([])
  }

  const triggerLabel = summary ?? (multi ? (selectedSet?.size ? `${selectedSet.size} selected` : `All ${label}`) : 'Select')

  return (
    <div className={`relative shrink-0 ${className}`.trim()}>
      <button
        ref={triggerRef}
        id={triggerId}
        type="button"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={panelId}
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 min-h-[40px] px-3 py-2 rounded-xl text-text-muted text-sm font-medium hover:text-text focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
      >
        {triggerIcon && <span className="text-text-muted shrink-0">{triggerIcon}</span>}
        <span className="min-w-0 truncate">{triggerLabel}</span>
        <IconChevronDown size={16} className="text-text-muted shrink-0" />
      </button>

      {open && (
        <div
          ref={panelRef}
          id={panelId}
          role="listbox"
          aria-labelledby={triggerId}
          className="absolute left-0 top-full mt-1 z-50 min-w-[180px] max-h-[320px] rounded-xl border border-border bg-surface shadow-lg overflow-hidden flex flex-col"
        >
          {multi && filteredOptions.length > searchThreshold && (
            <div className="p-2 border-b border-border">
              <div className="relative">
                <IconSearch size={16} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search"
                  className="w-full pl-8 pr-3 py-2 rounded-lg border border-border bg-background text-text text-sm placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary"
                  aria-label={`Search ${label}`}
                />
              </div>
            </div>
          )}

          <div className="overflow-y-auto py-1">
            {multi && (
              <button
                type="button"
                role="option"
                aria-selected={selectedSet.size === 0}
                onClick={handleMultiSelectAll}
                className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm text-text hover:bg-black/5 dark:hover:bg-white/5 focus:bg-black/5 dark:focus:bg-white/5 focus:outline-none"
              >
                <span className="w-5 h-5 flex items-center justify-center rounded border border-border shrink-0">
                  {selectedSet.size === 0 && (
                    <IconCheckSquare size={14} className="text-primary" />
                  )}
                </span>
                <span>{allOptionLabel ?? `All ${label}`}</span>
              </button>
            )}

            {filteredOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                role="option"
                aria-selected={multi ? selectedSet.has(opt.value) : value === opt.value}
                onClick={() => (multi ? handleMultiToggle(opt.value) : handleSingleSelect(opt.value))}
                className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm text-text hover:bg-black/5 dark:hover:bg-white/5 focus:bg-black/5 dark:focus:bg-white/5 focus:outline-none"
              >
                {multi && (
                  <span className="w-5 h-5 flex items-center justify-center rounded border border-border shrink-0">
                    {selectedSet.has(opt.value) && (
                      <IconCheckSquare size={14} className="text-primary" />
                    )}
                  </span>
                )}
                <span className="min-w-0 truncate">{opt.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
