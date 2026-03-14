import { IconFilter } from './Icons.jsx'

/**
 * FilterBar: container for the filters section. Renders a discrete filter icon on the left
 * and a flex row of filter controls (typically FilterDropdown components).
 *
 * @param {object} props
 * @param {React.ReactNode} props.children - Filter controls (e.g. FilterDropdown instances).
 * @param {string} [props.className] - Optional class for the wrapper.
 *
 * @example
 * <FilterBar>
 *   <FilterDropdown label="Dates" summary={dateLabel} options={DATE_OPTIONS} value={dateFilter} onChange={setDateFilter} />
 *   <FilterDropdown label="Category" summary={catSummary} options={catOptions} value={catFilter} onChange={setCatFilter} multi />
 * </FilterBar>
 */
export function FilterBar({ children, className = '' }) {
  return (
    <div
      role="group"
      aria-label="Filters"
      className={`flex flex-wrap items-center gap-2 ${className}`.trim()}
    >
      <span className="text-text-muted shrink-0" aria-hidden>
        <IconFilter size={18} />
      </span>
      <div className="flex flex-wrap items-center gap-2 min-w-0">
        {children}
      </div>
    </div>
  )
}
