import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useApi, IconPriority, IconCalendar, IconUser, IconTag, IconCircle, IconPlay, IconCheckSquare, IconTrash } from '@tools/shared'
import { field, str, dateStr, arr } from '@tools/shared'
import { getTaskStatusGroup } from '../lib/taskStatus'
import { getPriorityTagClass, STATUS_OPTIONS } from './TaskCard'

const PRIORITY_OPTIONS = ['Low', 'Medium', 'High']

/**
 * Modal de detalle/edición de Task. Igual que en Planner.
 * Props: task, onClose, onStatusChange(taskId, status), onTaskUpdate(taskId, fields), onTaskDelete(taskId), refetch().
 */
export function TaskModal({ task, onClose, onStatusChange, onTaskUpdate, onTaskDelete, refetch }) {
  const { fetchApi } = useApi()
  const [editingField, setEditingField] = useState(null)
  const [editValue, setEditValue] = useState('')
  const [objectiveItems, setObjectiveItems] = useState([]) // { id, name }[]
  const [keyResultItems, setKeyResultItems] = useState([]) // { id, name }[]

  const objectiveIdsFromTask = task ? arr(field(task, 'Objectives', 'Objective')) : []
  const keyResultIds = task ? arr(field(task, 'Key Result', 'Key Results')) : []
  const hasAny = objectiveIdsFromTask.length > 0 || keyResultIds.length > 0

  useEffect(() => {
    if (!hasAny) {
      setObjectiveItems([])
      setKeyResultItems([])
      return
    }
    setObjectiveItems(objectiveIdsFromTask.map((id) => ({ id, name: '…' })))
    setKeyResultItems(keyResultIds.map((id) => ({ id, name: '…' })))
    let cancelled = false
    Promise.all([
      fetchApi('/api/objectives').then((r) => r.data || []),
      fetchApi('/api/key-results').then((r) => r.data || []),
    ]).then(([objectives, keyResults]) => {
      if (cancelled) return
      // Objetivos: los que vienen en la task O los del Objective Link de cada KR (si la task no trae O)
      const objectiveIdsFromKR = keyResultIds.flatMap((kid) => {
        const kr = keyResults.find((r) => r.id === kid)
        return kr ? arr(field(kr, 'Objective Link', 'Objective')) : []
      }).filter(Boolean)
      const allObjectiveIds = [...new Set([...objectiveIdsFromTask, ...objectiveIdsFromKR])]
      setObjectiveItems(allObjectiveIds.map((id) => {
        const o = objectives.find((r) => r.id === id)
        return { id, name: o ? str(field(o, 'Objective Name', 'Objective Name')) || '(untitled)' : '…' }
      }))
      setKeyResultItems(keyResultIds.map((id) => {
        const kr = keyResults.find((r) => r.id === id)
        return { id, name: kr ? str(field(kr, 'Key Result Name', 'Key Result Name')) || '(untitled)' : '…' }
      }))
    }).catch(() => {})
    return () => { cancelled = true }
  }, [task?.id, fetchApi])

  if (!task) return null
  const name = str(field(task, 'Task Name', 'Task Name')) || ''
  const statusGroup = getTaskStatusGroup(task)
  const description = str(field(task, 'Description', 'Description')) || ''
  const priority = str(field(task, 'Priority', 'Priority')) || ''
  const dueStr = dateStr(field(task, 'Due Date', 'Due Date')) || ''
  const assignee = str(field(task, 'Assignee', 'Assignee')) || ''
  const category = str(field(task, 'Category', 'Category')) || ''

  const handleStatus = async (e, newStatus) => {
    e?.stopPropagation?.()
    try {
      await onStatusChange(task.id, newStatus)
      refetch?.()
    } catch (err) {
      console.error(err)
    }
  }

  const handleDelete = async () => {
    if (!onTaskDelete) return
    try {
      await onTaskDelete(task.id)
    } catch (err) {
      console.error(err)
    }
  }

  const startEdit = (fieldName, currentValue) => {
    setEditingField(fieldName)
    setEditValue(currentValue ?? '')
  }

  const saveEdit = async (fieldName, payload) => {
    try {
      await onTaskUpdate(task.id, payload)
      setEditingField(null)
    } catch (err) {
      console.error(err)
    }
  }

  const handleBlurName = () => {
    if (editingField !== 'name') return
    const v = editValue.trim()
    saveEdit('name', { 'Task Name': v || name || '(untitled)' })
  }
  const handleBlurDescription = () => {
    if (editingField !== 'description') return
    saveEdit('description', { Description: editValue })
  }
  const handleBlurAssignee = () => {
    if (editingField !== 'assignee') return
    saveEdit('assignee', { Assignee: editValue.trim() })
  }
  const handleBlurCategory = () => {
    if (editingField !== 'category') return
    saveEdit('category', { Category: editValue.trim() })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="task-modal-title"
    >
      <div
        className="bg-surface rounded-2xl border-2 border-border shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b border-border flex flex-col gap-1">
          <div className="flex items-center justify-between gap-3">
            {editingField === 'name' ? (
              <input
                type="text"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={handleBlurName}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleBlurName() } }}
                className="flex-1 min-w-0 font-bold text-xl text-text bg-surface border border-border rounded-lg px-2 py-1"
                id="task-modal-title"
                autoFocus
              />
            ) : (
              <h2
                id="task-modal-title"
                role="button"
                tabIndex={0}
                onClick={() => startEdit('name', name)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); startEdit('name', name) } }}
                className="font-bold text-xl text-text truncate flex-1 min-w-0 cursor-pointer rounded hover:bg-border/50 py-1 -mx-1 px-1"
              >
                {name || '(untitled)'}
              </h2>
            )}
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 p-2 rounded-lg text-text-muted hover:bg-border text-xl leading-none"
              aria-label="Close"
            >
              ×
            </button>
          </div>
          {hasAny && (
            <p className="text-sm text-text-muted flex items-center gap-1.5 flex-wrap" onClick={(e) => e.stopPropagation()}>
              {objectiveItems.map(({ id, name }) => (
                <Link key={id} to={`/objectives/${id}`} className="hover:underline">{name}</Link>
              ))}
              {objectiveItems.length > 0 && keyResultItems.length > 0 && <span aria-hidden> \ </span>}
              {keyResultItems.map(({ id, name }) => (
                <Link key={id} to={`/key-results/${id}`} className="hover:underline">{name}</Link>
              ))}
            </p>
          )}
        </div>
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {editingField === 'description' ? (
            <textarea
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={handleBlurDescription}
              className="w-full text-sm font-normal text-text bg-surface border border-border rounded-lg px-3 py-2 min-h-[80px] resize-y"
              placeholder="Description"
              autoFocus
            />
          ) : (
            <p
              role="button"
              tabIndex={0}
              onClick={() => startEdit('description', description)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); startEdit('description', description) } }}
              className="text-sm font-normal text-text whitespace-pre-wrap cursor-pointer rounded hover:bg-border/50 py-2 -mx-2 px-2 min-h-[2rem]"
            >
              {description || '(no description)'}
            </p>
          )}
          <hr className="border-border" />
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-text-muted shrink-0"><IconPriority size={18} /></span>
              <span className="text-text-muted shrink-0">Priority:</span>
              {editingField === 'priority' ? (
                <select
                  value={editValue}
                  onChange={(e) => { const v = e.target.value; saveEdit('priority', { Priority: v }); setEditValue(v) }}
                  onBlur={() => setEditingField(null)}
                  className="rounded border border-border bg-surface text-text px-2 py-1 text-sm"
                  autoFocus
                >
                  <option value="">—</option>
                  {PRIORITY_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              ) : (
                <span
                  role="button"
                  tabIndex={0}
                  onClick={() => startEdit('priority', priority)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); startEdit('priority', priority) } }}
                  className={`inline-flex px-1.5 py-0.5 rounded text-xs font-medium cursor-pointer ${getPriorityTagClass(priority)} hover:ring-2 ring-offset-2 ring-border`}
                >
                  {priority || '—'}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-text-muted shrink-0"><IconCalendar size={18} /></span>
              <span className="text-text-muted shrink-0">Due date:</span>
              {editingField === 'dueDate' ? (
                <input
                  type="date"
                  value={editValue}
                  onChange={(e) => { const v = e.target.value; saveEdit('dueDate', { 'Due Date': v || null }); setEditingField(null) }}
                  onBlur={() => setEditingField(null)}
                  className="rounded border border-border bg-surface text-text px-2 py-1 text-sm"
                  autoFocus
                />
              ) : (
                <span
                  role="button"
                  tabIndex={0}
                  onClick={() => startEdit('dueDate', dueStr)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); startEdit('dueDate', dueStr) } }}
                  className="text-text cursor-pointer rounded hover:bg-border/50 py-0.5 px-1"
                >
                  {dueStr || '—'}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-text-muted shrink-0"><IconUser size={18} /></span>
              <span className="text-text-muted shrink-0">Assignee:</span>
              {editingField === 'assignee' ? (
                <input
                  type="text"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onBlur={handleBlurAssignee}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleBlurAssignee() } }}
                  className="flex-1 min-w-0 rounded border border-border bg-surface text-text px-2 py-1 text-sm"
                  placeholder="Name"
                  autoFocus
                />
              ) : (
                <span
                  role="button"
                  tabIndex={0}
                  onClick={() => startEdit('assignee', assignee)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); startEdit('assignee', assignee) } }}
                  className="text-text cursor-pointer rounded hover:bg-border/50 py-0.5 px-1"
                >
                  {assignee || '—'}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-text-muted shrink-0"><IconTag size={18} /></span>
              <span className="text-text-muted shrink-0">Category:</span>
              {editingField === 'category' ? (
                <input
                  type="text"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onBlur={handleBlurCategory}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleBlurCategory() } }}
                  className="flex-1 min-w-0 rounded border border-border bg-surface text-text px-2 py-1 text-sm"
                  placeholder="Category"
                  autoFocus
                />
              ) : (
                <span
                  role="button"
                  tabIndex={0}
                  onClick={() => startEdit('category', category)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); startEdit('category', category) } }}
                  className="text-text cursor-pointer rounded hover:bg-border/50 py-0.5 px-1"
                >
                  {category || '—'}
                </span>
              )}
            </div>
          </div>
          <hr className="border-border" />
          <div className="flex items-center justify-between gap-2 w-full flex-wrap">
            <div className="flex flex-wrap gap-2">
              {STATUS_OPTIONS.map(({ value, label }) => {
                const isActive =
                  (value === 'Done' && statusGroup === 'done') ||
                  (value === 'In Progress' && statusGroup === 'in_progress') ||
                  (value === 'Pending' && statusGroup === 'pending')
                const isPending = value === 'Pending'
                const isInProgress = value === 'In Progress'
                const btnClass = isActive
                  ? isPending
                    ? 'bg-status-pending text-white'
                    : isInProgress
                      ? 'bg-status-in-progress text-white'
                      : 'bg-status-done text-white'
                  : 'bg-border text-text hover:bg-border/80'
                const Icon = isPending ? IconCircle : isInProgress ? IconPlay : IconCheckSquare
                return (
                  <button
                    key={value}
                    type="button"
                    title={label}
                    onClick={(e) => handleStatus(e, value)}
                    className={`min-h-[44px] px-3 md:px-4 rounded-xl text-sm font-medium flex items-center justify-center md:justify-start gap-2 shrink-0 cursor-pointer ${btnClass}`}
                  >
                    <Icon size={18} />
                    <span className="hidden md:inline">{label}</span>
                  </button>
                )
              })}
            </div>
            {onTaskDelete && (
              <button
                type="button"
                onClick={handleDelete}
                title="Delete task"
                className="min-h-[44px] px-3 rounded-xl flex items-center justify-center shrink-0 bg-transparent text-text-muted hover:bg-red-500/20 hover:text-red-600 dark:hover:text-red-400 transition-colors"
              >
                <IconTrash size={20} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
