import { useState } from 'react'
import { Modal } from '@tools/shared'
import { usePlannerApi } from '../contexts/PlannerApiContext'

const CREATE_OBJECTIVE = `
  mutation CreateObjective($input: ObjectiveCreateInput!) {
    createObjective(input: $input) { id objectiveName status }
  }
`

const PRIORITY_OPTIONS = ['Low', 'Medium', 'High']

/**
 * Modal to create a new objective.
 */
export function ObjectiveModal({ onClose, onSaved }) {
  const { graphql } = usePlannerApi()
  const [objectiveName, setObjectiveName] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState('Pending')
  const [priority, setPriority] = useState('')
  const [category, setCategory] = useState('')
  const [startDate, setStartDate] = useState('')
  const [targetDate, setTargetDate] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    const name = (objectiveName || '').trim() || '(untitled)'
    setSaving(true)
    try {
      await graphql(CREATE_OBJECTIVE, {
        input: {
          objectiveName: name,
          description: (description || '').trim() || undefined,
          status: status || undefined,
          priority: priority || undefined,
          category: (category || '').trim() || undefined,
          startDate: startDate || undefined,
          targetDate: targetDate || undefined,
        },
      })
      onSaved?.()
      onClose?.()
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={true} onClose={onClose} title="Create objective" ariaLabelledBy="objective-modal-title">
      <div className="space-y-4">
        <div>
          <label htmlFor="obj-name" className="block text-sm font-medium text-text-muted mb-1">
            Objective name
          </label>
          <input
            id="obj-name"
            type="text"
            value={objectiveName}
            onChange={(e) => setObjectiveName(e.target.value)}
            placeholder="Objective name"
            className="w-full rounded-lg border border-border bg-surface text-text px-3 py-2"
          />
        </div>
        <div>
          <label htmlFor="obj-desc" className="block text-sm font-medium text-text-muted mb-1">
            Description
          </label>
          <textarea
            id="obj-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description"
            className="w-full rounded-lg border border-border bg-surface text-text px-3 py-2 min-h-[60px] resize-y"
          />
        </div>
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="rounded border border-border bg-surface text-text px-2 py-1 text-sm"
            >
              <option value="Pending">Pending</option>
              <option value="In Progress">In progress</option>
              <option value="Done">Done</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">Priority</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="rounded border border-border bg-surface text-text px-2 py-1 text-sm"
            >
              <option value="">—</option>
              {PRIORITY_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">Category</label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Category"
              className="rounded border border-border bg-surface text-text px-2 py-1 text-sm"
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">Start date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="rounded border border-border bg-surface text-text px-2 py-1 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">Target date</label>
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="rounded border border-border bg-surface text-text px-2 py-1 text-sm"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-border text-text hover:bg-border"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary/90 disabled:opacity-50"
          >
            {saving ? 'Creating…' : 'Create'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
