import { useState, useEffect } from 'react'
import { Modal, IconPriority, IconCalendar, IconTrash } from '@tools/shared'
import { usePlannerApi } from '../contexts/PlannerApiContext'

const TASK_CREATE = `
  mutation CreateTask($input: TaskCreateInput!) {
    createTask(input: $input) { id taskName status description dueDate priority }
  }
`
const TASK_UPDATE = `
  mutation UpdateTask($id: ID!, $input: TaskUpdateInput!) {
    updateTask(id: $id, input: $input) { id taskName status description dueDate priority }
  }
`
const TASK_DELETE = `
  mutation DeleteTask($id: ID!) { deleteTask(id: $id) }
`

const STATUS_OPTIONS = [
  { value: 'Pending', label: 'Pending' },
  { value: 'In Progress', label: 'In progress' },
  { value: 'Done', label: 'Done' },
]
const PRIORITY_OPTIONS = ['Low', 'Medium', 'High']

/**
 * Task create/edit modal. Save button applies changes; closing without Save does not persist.
 * Props: task (null = create), onClose, onSaved (called after create/update/delete), initialValues (create: { dueDate, keyResults }).
 */
export function TaskModal({ task, onClose, onSaved, initialValues = {} }) {
  const { graphql } = usePlannerApi()
  const isCreate = task == null

  const [taskName, setTaskName] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState('Pending')
  const [dueDate, setDueDate] = useState('')
  const [priority, setPriority] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)

  useEffect(() => {
    if (isCreate) {
      setTaskName('')
      setDescription('')
      setStatus(initialValues.status || 'Pending')
      setDueDate(initialValues.dueDate || '')
      setPriority(initialValues.priority || '')
    } else {
      setTaskName(task.taskName || '')
      setDescription(task.description || '')
      setStatus(task.status || 'Pending')
      setDueDate(task.dueDate || '')
      setPriority(task.priority || '')
    }
    setDeleteConfirm(false)
  }, [task?.id, isCreate, initialValues.dueDate, initialValues.status, initialValues.priority])

  const handleSave = async () => {
    setSaving(true)
    try {
      if (isCreate) {
        await graphql(TASK_CREATE, {
          input: {
            taskName: (taskName || '').trim() || '(untitled)',
            description: (description || '').trim() || undefined,
            status: status || undefined,
            dueDate: dueDate || undefined,
            priority: priority || undefined,
            keyResults: initialValues.keyResults,
            objectives: initialValues.objectives,
          },
        })
      } else {
        await graphql(TASK_UPDATE, {
          id: task.id,
          input: {
            taskName: (taskName || '').trim() || '(untitled)',
            description: (description || '').trim() || undefined,
            status: status || undefined,
            dueDate: dueDate || undefined,
            priority: priority || undefined,
          },
        })
      }
      onSaved?.()
      onClose?.()
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!task?.id) return
    setSaving(true)
    try {
      await graphql(TASK_DELETE, { id: task.id })
      onSaved?.()
      onClose?.()
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={true}
      onClose={onClose}
      title={isCreate ? 'New task' : 'Edit task'}
      ariaLabelledBy="task-modal-title"
    >
      <div className="space-y-4">
        <div>
          <label htmlFor="task-name" className="block text-sm font-medium text-text-muted mb-1">
            Task name
          </label>
          <input
            id="task-name"
            type="text"
            value={taskName}
            onChange={(e) => setTaskName(e.target.value)}
            placeholder="Task name"
            className="w-full rounded-lg border border-border bg-surface text-text px-3 py-2"
          />
        </div>
        <div>
          <label htmlFor="task-desc" className="block text-sm font-medium text-text-muted mb-1">
            Description
          </label>
          <textarea
            id="task-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description"
            className="w-full rounded-lg border border-border bg-surface text-text px-3 py-2 min-h-[80px] resize-y"
          />
        </div>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <IconPriority size={18} className="text-text-muted shrink-0" />
            <label htmlFor="task-priority" className="text-sm text-text-muted shrink-0">
              Priority
            </label>
            <select
              id="task-priority"
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
          <div className="flex items-center gap-2">
            <IconCalendar size={18} className="text-text-muted shrink-0" />
            <label htmlFor="task-due" className="text-sm text-text-muted shrink-0">
              Due date
            </label>
            <input
              id="task-due"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="rounded border border-border bg-surface text-text px-2 py-1 text-sm"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-text-muted mb-1">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full rounded border border-border bg-surface text-text px-3 py-2"
          >
            {STATUS_OPTIONS.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        {!isCreate && (
          <div className="pt-2 border-t border-border">
            {!deleteConfirm ? (
              <button
                type="button"
                onClick={() => setDeleteConfirm(true)}
                className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm hover:underline"
              >
                <IconTrash size={18} />
                Delete task
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-sm text-text-muted">Delete this task?</span>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={saving}
                  className="px-3 py-1 rounded bg-red-600 text-white text-sm hover:bg-red-700 disabled:opacity-50"
                >
                  Yes, delete
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteConfirm(false)}
                  className="px-3 py-1 rounded bg-border text-text text-sm"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        )}
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
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
