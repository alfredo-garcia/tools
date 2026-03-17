import { useState } from 'react'
import { Modal } from '@tools/shared'
import { usePlannerApi } from '../contexts/PlannerApiContext'

const CREATE_KEY_RESULT = `
  mutation CreateKeyResult($input: KeyResultCreateInput!) {
    createKeyResult(input: $input) { id keyResultName status }
  }
`

/**
 * Modal to create a new key result, optionally linked to an objective.
 */
export function KeyResultCreateModal({ onClose, onSaved, objectiveId }) {
  const { graphql } = usePlannerApi()
  const [keyResultName, setKeyResultName] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState('Not Started')
  const [metric, setMetric] = useState('')
  const [currentValue, setCurrentValue] = useState('')
  const [targetValue, setTargetValue] = useState('')
  const [unit, setUnit] = useState('')
  const [deadline, setDeadline] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    const name = (keyResultName || '').trim() || '(untitled)'
    setSaving(true)
    try {
      await graphql(CREATE_KEY_RESULT, {
        input: {
          keyResultName: name,
          description: (description || '').trim() || undefined,
          status: status || undefined,
          metric: (metric || '').trim() || undefined,
          currentValue: currentValue === '' ? undefined : parseFloat(currentValue),
          targetValue: targetValue === '' ? undefined : parseFloat(targetValue),
          unit: (unit || '').trim() || undefined,
          deadline: deadline || undefined,
          objectiveLink: objectiveId ? [objectiveId] : undefined,
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
    <Modal open={true} onClose={onClose} title="Create key result" ariaLabelledBy="kr-modal-title">
      <div className="space-y-4">
        <div>
          <label htmlFor="kr-name" className="block text-sm font-medium text-text-muted mb-1">
            Key result name
          </label>
          <input
            id="kr-name"
            type="text"
            value={keyResultName}
            onChange={(e) => setKeyResultName(e.target.value)}
            placeholder="Key result name"
            className="w-full rounded-lg border border-border bg-surface text-text px-3 py-2"
          />
        </div>
        <div>
          <label htmlFor="kr-desc" className="block text-sm font-medium text-text-muted mb-1">
            Description
          </label>
          <textarea
            id="kr-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description"
            className="w-full rounded-lg border border-border bg-surface text-text px-3 py-2 min-h-[60px] resize-y"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-text-muted mb-1">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full rounded border border-border bg-surface text-text px-3 py-2"
          >
            <option value="Not Started">Not Started</option>
            <option value="In Progress">In Progress</option>
            <option value="Achieved">Achieved</option>
            <option value="Behind">Behind</option>
            <option value="Missed">Missed</option>
          </select>
        </div>
        <div>
          <label htmlFor="kr-metric" className="block text-sm font-medium text-text-muted mb-1">
            Metric
          </label>
          <input
            id="kr-metric"
            type="text"
            value={metric}
            onChange={(e) => setMetric(e.target.value)}
            placeholder="Metric"
            className="w-full rounded-lg border border-border bg-surface text-text px-3 py-2"
          />
        </div>
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">Current value</label>
            <input
              type="number"
              value={currentValue}
              onChange={(e) => setCurrentValue(e.target.value)}
              placeholder="0"
              className="rounded border border-border bg-surface text-text px-2 py-1 text-sm w-24"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">Target value</label>
            <input
              type="number"
              value={targetValue}
              onChange={(e) => setTargetValue(e.target.value)}
              placeholder="0"
              className="rounded border border-border bg-surface text-text px-2 py-1 text-sm w-24"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">Unit</label>
            <input
              type="text"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              placeholder="e.g. %"
              className="rounded border border-border bg-surface text-text px-2 py-1 text-sm w-20"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">Deadline</label>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
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
