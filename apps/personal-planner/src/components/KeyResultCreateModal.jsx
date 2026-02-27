import { useState } from 'react'
import { IconCalendar, IconTag, IconCircle, IconTarget, IconCheckSquare } from '@tools/shared'

const STATUS_OPTIONS = ['Pending', 'In Progress', 'Done']

/**
 * Modal to create a new Key Result linked to an Objective.
 * Props: objectiveId (required), onClose, onCreate(fields).
 */
export function KeyResultCreateModal({ objectiveId, onClose, onCreate }) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState('Pending')
  const [metric, setMetric] = useState('')
  const [currentValue, setCurrentValue] = useState('')
  const [targetValue, setTargetValue] = useState('')
  const [unit, setUnit] = useState('')
  const [deadline, setDeadline] = useState('')
  const [progress, setProgress] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    const keyResultName = name.trim() || '(untitled)'
    const fields = {
      'Key Result Name': keyResultName,
      'Objective Link': objectiveId ? [objectiveId] : undefined,
      Description: description.trim() || undefined,
      Status: status,
      Metric: metric.trim() || undefined,
      'Current Value': currentValue.trim() === '' ? undefined : (Number(currentValue) ?? currentValue),
      'Target Value': targetValue.trim() === '' ? undefined : (Number(targetValue) ?? targetValue),
      Unit: unit.trim() || undefined,
      Deadline: deadline || undefined,
      'Progress (%)': progress.trim() === '' ? undefined : Number(progress),
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
      aria-labelledby="kr-modal-title"
    >
      <div
        className="bg-surface rounded-2xl border-2 border-border shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b border-border flex items-center justify-between gap-3">
          <h2 id="kr-modal-title" className="font-bold text-xl text-text">New key result</h2>
          <button type="button" onClick={onClose} className="shrink-0 p-2 rounded-lg text-text-muted hover:bg-border text-xl leading-none" aria-label="Close">×</button>
        </div>
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">Key result name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Key result name"
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
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-text-muted shrink-0"><IconCircle size={18} /></span>
              <label className="text-text-muted shrink-0">Status:</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)} className="flex-1 min-w-0 rounded-lg border border-border bg-surface text-text px-3 py-2 text-sm">
                {STATUS_OPTIONS.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-text-muted shrink-0"><IconTag size={18} /></span>
              <label className="text-text-muted shrink-0">Metric:</label>
              <input type="text" value={metric} onChange={(e) => setMetric(e.target.value)} placeholder="Metric" className="flex-1 min-w-0 rounded-lg border border-border bg-surface text-text px-3 py-2 text-sm" />
            </div>
            <div className="grid grid-cols-[1fr_1fr_auto] gap-2 items-end">
              <div>
                <label className="block text-sm font-medium text-text-muted mb-1">
                  <span className="inline-flex items-center gap-1"><IconCircle size={16} /> Current value</span>
                </label>
                <input type="text" value={currentValue} onChange={(e) => setCurrentValue(e.target.value)} placeholder="Current" className="w-full rounded-lg border border-border bg-surface text-text px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-muted mb-1">
                  <span className="inline-flex items-center gap-1"><IconTarget size={16} /> Target value</span>
                </label>
                <input type="text" value={targetValue} onChange={(e) => setTargetValue(e.target.value)} placeholder="Target" className="w-full rounded-lg border border-border bg-surface text-text px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-muted mb-1">
                  <span className="inline-flex items-center gap-1"><IconTag size={16} /> Unit</span>
                </label>
                <input type="text" value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="e.g. %" className="w-full rounded-lg border border-border bg-surface text-text px-3 py-2 text-sm min-w-[4rem]" />
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-text-muted shrink-0"><IconCalendar size={18} /></span>
              <label className="text-text-muted shrink-0">Deadline:</label>
              <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} className="flex-1 min-w-0 rounded-lg border border-border bg-surface text-text px-3 py-2 text-sm" />
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-text-muted shrink-0"><IconCheckSquare size={18} /></span>
              <label className="text-text-muted shrink-0">Progress (%):</label>
              <input type="number" min={0} max={100} value={progress} onChange={(e) => setProgress(e.target.value)} placeholder="0–100" className="w-24 rounded-lg border border-border bg-surface text-text px-3 py-2 text-sm" />
            </div>
          </div>
          <div className="pt-2 flex justify-end">
            <button type="button" onClick={handleSubmit} disabled={submitting} className="min-h-[44px] px-6 rounded-xl text-sm font-medium bg-primary text-white hover:bg-primary/90 disabled:opacity-50">
              {submitting ? 'Creating…' : 'Create key result'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
