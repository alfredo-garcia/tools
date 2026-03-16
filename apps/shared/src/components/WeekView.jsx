import { IconChevronLeft, IconChevronRight } from './Icons.jsx'

/**
 * WeekView: layout genérico para vista semanal (cabecera de días + navegación).
 * No conoce tasks/habits/meals; las apps pasan renderDayHeader y renderDayColumn o children.
 *
 * Props:
 * - weekDays: string[] (YYYY-MM-DD por día, 7 elementos)
 * - onPrevWeek?: () => void
 * - onNextWeek?: () => void
 * - renderDayHeader?: (dayStr, dayIndex) => ReactNode
 * - children: contenido principal (grid de columnas por día, o contenido custom)
 * - className?: string
 */
export function WeekView({
  weekDays,
  onPrevWeek,
  onNextWeek,
  renderDayHeader,
  children,
  className = '',
}) {
  return (
    <div className={className}>
      {weekDays != null && weekDays.length > 0 && (onPrevWeek != null || onNextWeek != null || renderDayHeader != null) && (
        <div className="grid grid-cols-7 gap-3 border-b border-border pb-3 items-stretch">
          {weekDays.map((dayStr, i) => (
            <div key={dayStr} className="flex items-center gap-1 min-w-0">
              {i === 0 && onPrevWeek != null && (
                <button
                  type="button"
                  onClick={onPrevWeek}
                  aria-label="Previous week"
                  className="shrink-0 p-1.5 rounded-lg text-text-muted hover:bg-border hover:text-text"
                >
                  <IconChevronLeft size={20} />
                </button>
              )}
              <div className="flex-1 min-w-0">
                {renderDayHeader != null ? renderDayHeader(dayStr, i) : <span className="text-text">{dayStr}</span>}
              </div>
              {i === 6 && onNextWeek != null && (
                <button
                  type="button"
                  onClick={onNextWeek}
                  aria-label="Next week"
                  className="shrink-0 p-1.5 rounded-lg text-text-muted hover:bg-border hover:text-text"
                >
                  <IconChevronRight size={20} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
      {children}
    </div>
  )
}
