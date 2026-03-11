import { useState, useEffect } from 'react'
import { usePlannerApi } from '../contexts/PlannerApiContext'

/**
 * Modal to create a Google Calendar event.
 * Props: onClose, onCreate() called after success, onRefetch() to refresh events list, initialDate (YYYY-MM-DD, optional).
 */
export function EventModal({ onClose, onCreate, onRefetch, initialDate }) {
  const { fetchApi } = usePlannerApi()
  const [connections, setConnections] = useState([])
  const [summary, setSummary] = useState('')
  const [description, setDescription] = useState('')
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
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
    if (initialDate) {
      setStart(`${initialDate}T09:00`)
      setEnd(`${initialDate}T10:00`)
    }
  }, [initialDate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const startVal = start || ''
      const endVal = end || ''
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
      await fetchApi('/api/calendar/events', {
        method: 'POST',
        body: JSON.stringify({
          summary: summary.trim(),
          description: description.trim() || undefined,
          start: startISO,
          end: endISO,
          calendarSlot,
        }),
      })
      onCreate?.()
      onRefetch?.()
      onClose()
    } catch (err) {
      setError(err.message || 'Failed to create event')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" role="dialog" aria-modal="true" aria-labelledby="event-modal-title">
      <div className="rounded-2xl border-2 border-border bg-surface text-text shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 id="event-modal-title" className="text-lg font-bold text-text mb-4">New event</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            {connections.length > 0 && (
              <div>
                <label htmlFor="event-calendar" className="block text-sm font-medium text-text mb-1">Calendar</label>
                <select
                  id="event-calendar"
                  value={calendarSlot}
                  onChange={(e) => setCalendarSlot(Number(e.target.value))}
                  className="w-full min-h-[44px] px-3 rounded-xl border-2 border-border bg-surface text-text"
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
              <label htmlFor="event-start" className="block text-sm font-medium text-text mb-1">Start</label>
              <input
                id="event-start"
                type="datetime-local"
                value={start}
                onChange={(e) => setStart(e.target.value)}
                className="w-full min-h-[44px] px-3 rounded-xl border-2 border-border bg-surface text-text"
              />
            </div>
            <div>
              <label htmlFor="event-end" className="block text-sm font-medium text-text mb-1">End</label>
              <input
                id="event-end"
                type="datetime-local"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                className="w-full min-h-[44px] px-3 rounded-xl border-2 border-border bg-surface text-text"
              />
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
                {submitting ? 'Creating…' : 'Create event'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
