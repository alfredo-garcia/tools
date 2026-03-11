import { useState, useEffect } from 'react'
import { usePlannerApi } from '../contexts/PlannerApiContext'
import { EventModalDatePicker, EventModalTimeSelect } from './EventModalDatePicker'

/** Parse event start/end ISO strings into date (YYYY-MM-DD) and time (HH:mm). */
function parseEventDateTime(iso) {
  if (!iso || typeof iso !== 'string') return { date: '', time: '09:00' }
  const date = iso.slice(0, 10)
  const hasTime = iso.length > 10 && iso[10] === 'T'
  const time = hasTime && iso.length >= 16 ? iso.slice(11, 16) : '09:00'
  return { date, time }
}

/**
 * Modal to create or edit a Google Calendar event.
 * Props: onClose, onCreate() called after create success, onRefetch() to refresh events list,
 * initialDate (YYYY-MM-DD, optional), event (optional) — when set, modal is in edit mode.
 */
export function EventModal({ onClose, onCreate, onRefetch, initialDate, event: editEvent }) {
  const isEdit = Boolean(editEvent?.id)
  const { fetchApi } = usePlannerApi()
  const [connections, setConnections] = useState([])
  const [summary, setSummary] = useState('')
  const [startDate, setStartDate] = useState('')
  const [startTime, setStartTime] = useState('09:00')
  const [endDate, setEndDate] = useState('')
  const [endTime, setEndTime] = useState('10:00')
  const [description, setDescription] = useState('')
  const [calendarSlot, setCalendarSlot] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchApi('/api/calendar/status')
      .then((r) => {
        const list = Array.isArray(r?.connections) ? r.connections : []
        setConnections(list)
        if (list.length > 0 && !list.find((c) => c.slot === calendarSlot)) {
          setCalendarSlot(list[0].slot)
        }
      })
      .catch(() => setConnections([]))
  }, [fetchApi])

  useEffect(() => {
    if (editEvent) {
      setSummary(editEvent.summary || '')
      setDescription(editEvent.description || '')
      const start = parseEventDateTime(editEvent.start)
      const end = parseEventDateTime(editEvent.end)
      setStartDate(start.date)
      setStartTime(start.time)
      setEndDate(end.date)
      setEndTime(end.time)
      if (editEvent.calendarSlot != null) setCalendarSlot(Number(editEvent.calendarSlot))
    }
  }, [editEvent?.id])

  useEffect(() => {
    if (editEvent) return
    if (initialDate) {
      setStartDate(initialDate)
      setEndDate(initialDate)
    } else {
      const today = new Date()
      const todayStr = today.toISOString().slice(0, 10)
      setStartDate(todayStr)
      setEndDate(todayStr)
    }
    setStartTime('09:00')
    setEndTime('10:00')
  }, [initialDate, editEvent])

  const startVal = startDate && startTime ? `${startDate}T${startTime}` : ''
  const endVal = endDate && endTime ? `${endDate}T${endTime}` : ''

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      if (!summary.trim()) {
        setError('Title is required')
        setSubmitting(false)
        return
      }
      if (!startVal || !endVal) {
        setError('Start and end date/time are required')
        setSubmitting(false)
        return
      }
      const startISO = startVal.length <= 16 ? `${startVal}:00` : startVal
      const endISO = endVal.length <= 16 ? `${endVal}:00` : endVal
      const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone
      if (isEdit && editEvent?.id) {
        await fetchApi('/api/calendar/events', {
          method: 'PATCH',
          body: JSON.stringify({
            eventId: editEvent.id,
            calendarSlot,
            summary: summary.trim(),
            description: description.trim() || undefined,
            start: startISO,
            end: endISO,
            timeZone,
          }),
        })
      } else {
        await fetchApi('/api/calendar/events', {
          method: 'POST',
          body: JSON.stringify({
            summary: summary.trim(),
            description: description.trim() || undefined,
            start: startISO,
            end: endISO,
            calendarSlot,
            timeZone,
          }),
        })
        onCreate?.()
      }
      await Promise.resolve(onRefetch?.())
      onClose()
    } catch (err) {
      setError(err.message || (isEdit ? 'Failed to update event' : 'Failed to create event'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" role="dialog" aria-modal="true" aria-labelledby="event-modal-title">
      <div className="rounded-2xl border-2 border-border bg-surface text-text shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 id="event-modal-title" className="text-lg font-bold text-text mb-4">{isEdit ? 'Edit event' : 'New event'}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            {connections.length > 0 && (
              <div>
                <label htmlFor="event-calendar" className="block text-sm font-medium text-text mb-1">Calendar</label>
                <select
                  id="event-calendar"
                  value={calendarSlot}
                  onChange={(e) => setCalendarSlot(Number(e.target.value))}
                  disabled={isEdit}
                  className="w-full min-h-[44px] px-3 rounded-xl border-2 border-border bg-surface text-text disabled:opacity-70"
                  aria-readonly={isEdit}
                >
                  {connections.map((c) => (
                    <option key={c.slot} value={c.slot}>
                      {c.label || `Calendar ${c.slot}`}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label htmlFor="event-summary" className="block text-sm font-medium text-text mb-1">Title</label>
              <input
                id="event-summary"
                type="text"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                className="w-full min-h-[44px] px-3 rounded-xl border-2 border-border bg-surface text-text"
                placeholder="Event title"
              />
            </div>
            <div>
              <span id="event-start-label" className="block text-sm font-medium text-text mb-1">Start</span>
              <div className="flex gap-2 flex-wrap">
                <div className="flex-1 min-w-[140px]">
                  <EventModalDatePicker
                    id="event-start-date"
                    labelId="event-start-label"
                    value={startDate}
                    onChange={(d) => { setStartDate(d); if (!endDate) setEndDate(d) }}
                  />
                </div>
                <div className="w-[120px] shrink-0">
                  <EventModalTimeSelect
                    id="event-start-time"
                    labelId="event-start-label"
                    value={startTime}
                    onChange={setStartTime}
                  />
                </div>
              </div>
            </div>
            <div>
              <span id="event-end-label" className="block text-sm font-medium text-text mb-1">End</span>
              <div className="flex gap-2 flex-wrap">
                <div className="flex-1 min-w-[140px]">
                  <EventModalDatePicker
                    id="event-end-date"
                    labelId="event-end-label"
                    value={endDate}
                    onChange={setEndDate}
                  />
                </div>
                <div className="w-[120px] shrink-0">
                  <EventModalTimeSelect
                    id="event-end-time"
                    labelId="event-end-label"
                    value={endTime}
                    onChange={setEndTime}
                  />
                </div>
              </div>
            </div>
            <div>
              <label htmlFor="event-description" className="block text-sm font-medium text-text mb-1">Description (optional)</label>
              <textarea
                id="event-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 rounded-xl border-2 border-border bg-surface text-text resize-y"
              />
            </div>
            {error && (
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            )}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="min-h-[44px] px-4 rounded-xl border-2 border-border bg-surface text-text font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || connections.length === 0}
                className="min-h-[44px] px-4 rounded-xl border-2 border-primary bg-primary text-white font-medium disabled:opacity-50"
              >
                {submitting ? (isEdit ? 'Saving…' : 'Creating…') : (isEdit ? 'Save changes' : 'Create event')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
