import { useState, useRef, useEffect } from 'react'
import { IconChevronLeft, IconChevronRight } from '@tools/shared'

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

/**
 * Calendar grid date picker. value/onChange use YYYY-MM-DD.
 */
export function EventModalDatePicker({ value, onChange, id, labelId, className = '' }) {
  const [open, setOpen] = useState(false)
  const [viewDate, setViewDate] = useState(() => {
    if (value) {
      const [y, m] = value.slice(0, 7).split('-').map(Number)
      return new Date(y, m - 1, 1)
    }
    return new Date()
  })
  const popoverRef = useRef(null)

  useEffect(() => {
    if (value) {
      const [y, m] = value.slice(0, 7).split('-').map(Number)
      setViewDate(new Date(y, m - 1, 1))
    }
  }, [value])

  useEffect(() => {
    if (!open) return
    const handleClickOutside = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  const rows = []
  for (let i = 0; i < cells.length; i += 7) {
    rows.push(cells.slice(i, i + 7))
  }
  if (rows.length > 0) {
    const last = rows[rows.length - 1]
    while (last.length < 7) last.push(null)
  }

  const formatDisplay = (dateStr) => {
    if (!dateStr) return ''
    const d = new Date(dateStr + 'T12:00:00')
    return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
  }

  const selectDay = (day) => {
    if (!day) return
    const y = viewDate.getFullYear()
    const m = String(viewDate.getMonth() + 1).padStart(2, '0')
    const d = String(day).padStart(2, '0')
    onChange(`${y}-${m}-${d}`)
    setOpen(false)
  }

  const prevMonth = () => setViewDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))
  const nextMonth = () => setViewDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))

  const todayStr = (() => {
    const t = new Date()
    return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`
  })()

  return (
    <div className={`relative ${className}`} ref={popoverRef}>
      <button
        type="button"
        id={id}
        aria-labelledby={labelId}
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((o) => !o)}
        className="w-full min-h-[44px] px-3 rounded-xl border-2 border-border bg-surface text-text text-left flex items-center justify-between"
      >
        <span>{value ? formatDisplay(value) : 'Select date'}</span>
        <span className="text-text-muted text-sm" aria-hidden>{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div
          role="dialog"
          aria-label="Choose date"
          className="absolute z-50 top-full left-0 mt-1 p-3 rounded-xl border-2 border-border bg-surface shadow-lg min-w-[280px]"
        >
          <div className="flex items-center justify-between gap-2 mb-2">
            <button type="button" onClick={prevMonth} className="p-1.5 rounded-lg border border-border bg-surface text-text hover:bg-gray-100 dark:hover:bg-gray-700" aria-label="Previous month">
              <IconChevronLeft size={20} />
            </button>
            <span className="font-semibold text-text">
              {MONTH_NAMES[month]} {year}
            </span>
            <button type="button" onClick={nextMonth} className="p-1.5 rounded-lg border border-border bg-surface text-text hover:bg-gray-100 dark:hover:bg-gray-700" aria-label="Next month">
              <IconChevronRight size={20} />
            </button>
          </div>
          <div className="grid grid-cols-7 gap-0.5 text-center text-xs text-text-muted mb-1">
            {WEEKDAY_LABELS.map((w) => (
              <span key={w} className="py-1">{w}</span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-0.5">
            {rows.flatMap((row, ri) =>
              row.map((day, di) => {
                if (day == null) {
                  return <span key={`${ri}-${di}`} className="w-8 h-8" />
                }
                const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                const isSelected = value === dateStr
                const isToday = dateStr === todayStr
                return (
                  <button
                    key={`${ri}-${di}-${day}`}
                    type="button"
                    onClick={() => selectDay(day)}
                    className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                      isSelected
                        ? 'bg-primary text-white'
                        : isToday
                          ? 'bg-primary/20 text-primary dark:bg-primary/30'
                          : 'text-text hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    {day}
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}

/** Time options every 30 minutes (00:00–23:30), like Google Calendar. value/onChange: HH:MM. */
export function EventModalTimeSelect({ value, onChange, id, labelId, className = '' }) {
  const options = []
  for (let h = 0; h < 24; h++) {
    for (let m of [0, 30]) {
      const hh = String(h).padStart(2, '0')
      const mm = String(m).padStart(2, '0')
      options.push(`${hh}:${mm}`)
    }
  }
  const formatLabel = (hhmm) => {
    const [h, m] = hhmm.split(':').map(Number)
    const mm = String(m).padStart(2, '0')
    if (h === 0) return `12:${mm} AM`
    if (h === 12) return `12:${mm} PM`
    if (h < 12) return `${h}:${mm} AM`
    return `${h - 12}:${mm} PM`
  }
  return (
    <select
      id={id}
      aria-labelledby={labelId}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`min-h-[44px] px-3 rounded-xl border-2 border-border bg-surface text-text ${className}`}
    >
      {options.map((opt) => (
        <option key={opt} value={opt}>
          {formatLabel(opt)}
        </option>
      ))}
    </select>
  )
}
