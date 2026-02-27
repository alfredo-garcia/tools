import { useState } from 'react'
import { IconPriority, IconCalendar, IconTag, IconCircle } from '@tools/shared'

const PRIORITY_OPTIONS = ['Low', 'Medium', 'High']
const STATUS_OPTIONS = ['Pending', 'In Progress', 'Done']

/**
 * Modal to create a new Objective. Calls onCreate(fields) then onClose.
 */
export function ObjectiveModal({ onClose, onCreate }) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [priority, setPriority] = useState('')
  const [startDate, setStartDate] = useState('')
  const [targetDate, setTargetDate] = useState('')
  const [status, setStatus] = useState('Pending')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    const objectiveName = name.trim() || '(untitled)'
    const fields = {
      'Objective Name': objectiveName,
      Description: description.trim() || undefined,
      Category: category.trim() || undefined,
      Priority: priority || undefined,
      'Start Date': startDate || undefined,
      'Target Date': targetDate || undefined,
      Status: status,
    }
    setSubmitting(true)
    try {
      await onCreate(fields)
      onClose()
    } catch (err) {
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="objective-modal-title"
    >
      <div
        className="bg-surface rounded-2xl border-2 border-border shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b border-border flex items-center justify-between gap-3">
          <h2 id="objective-modal-title" className="font-bold text-xl text-text">New objective</h2>
          <button type="button" onClick={onClose} className="shrink-0 p-2 rounded-lg text-text-muted hover:bg-border text-xl leading-none" aria-label="Close">×</button>
        </div>
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">Objective name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Objective name"
              className="w-full rounded-lg border border-border bg-surface text-text px-3 py-2"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description"
              className="w-full rounded-lg border border-border bg-surface text-text px-3 py-2 min-h-[80px] resize-y"
            />
          </div>
          <hr className="border-border" />
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-text-muted shrink-0"><IconPriority size={18} /></span>
              <label className="text-text-muted shrink-0">Priority:</label>
              <select value={priority} onChange={(e) => setPriority(e.target.value)} className="flex-1 min-w-0 rounded-lg border border-border bg-surface text-text px-3 py-2 text-sm">
                <option value="">—</option>
                {PRIORITY_OPTIONS.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-text-muted shrink-0"><IconTag size={18} /></span>
              <label className="text-text-muted shrink-0">Category:</label>
              <input type="text" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Category" className="flex-1 min-w-0 rounded-lg border border-border bg-surface text-text px-3 py-2 text-sm" />
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-text-muted shrink-0"><IconCalendar size={18} /></span>
              <label className="text-text-muted shrink-0">Start date:</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="flex-1 min-w-0 rounded-lg border border-border bg-surface text-text px-3 py-2 text-sm" />
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-text-muted shrink-0"><IconCalendar size={18} /></span>
              <label className="text-text-muted shrink-0">Target date:</label>
              <input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} className="flex-1 min-w-0 rounded-lg border border-border bg-surface text-text px-3 py-2 text-sm" />
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-text-muted shrink-0"><IconCircle size={18} /></span>
              <label className="text-text-muted shrink-0">Status:</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)} className="flex-1 min-w-0 rounded-lg border border-border bg-surface text-text px-3 py-2 text-sm">
                {STATUS_OPTIONS.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>
          </div>
          <div className="pt-2 flex justify-end">
            <button type="button" onClick={handleSubmit} disabled={submitting} className="min-h-[44px] px-6 rounded-xl text-sm font-medium bg-primary text-white hover:bg-primary/90 disabled:opacity-50">
              {submitting ? 'Creating…' : 'Create objective'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
