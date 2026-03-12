import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { IconTag, IconTrash, IconCalendar, IconTarget } from '@tools/shared'
import { usePlannerApi } from '../contexts/PlannerApiContext'
import { field, str, arr, dateStr as toDateStr } from '@tools/shared'

/** Airtable Status values and UI labels. */
const STATUS_OPTIONS = [
  { value: 'New', label: 'Parking lot' },
  { value: 'Under Review', label: 'Discovery' },
  { value: 'Explored', label: 'Done' },
  { value: 'Archived', label: 'Archived' },
]
const PRIORITY_OPTIONS = ['High', 'Medium', 'Low']
/** Same category options as in TaskModal. */
const CATEGORY_OPTIONS = ['Health', 'Learning', 'Social & Recreation', 'Business', 'Productivity', 'Obligations', 'Finance', 'Others']

/** Airtable puede devolver "Objetives" (typo en la base). */
function getObjectiveIds(idea) {
  return arr(field(idea, 'Objetives', 'Objectives', 'Objective'))
}

/**
 * Modal de detalle/edición de Discovery Idea, o creación si idea es null.
 * Campos: Idea Name, Idea Description, Category, Status, Priority, Date Added, Objetives (mapeo Airtable "Discovery Ideas").
 */
export function DiscoveryModal({ idea, onClose, onCreate, onIdeaUpdate, onIdeaDelete, refetch }) {
  const { fetchApi } = usePlannerApi()
  const isCreate = idea == null
  const [editingField, setEditingField] = useState(null)
  const [editValue, setEditValue] = useState('')
  const [objectiveItems, setObjectiveItems] = useState([])
  const [allObjectives, setAllObjectives] = useState([])

  const [createName, setCreateName] = useState('')
  const [createDescription, setCreateDescription] = useState('')
  const [createCategory, setCreateCategory] = useState('')
  const [createStatus, setCreateStatus] = useState('New')
  const [createPriority, setCreatePriority] = useState('')
  const [createObjectiveIds, setCreateObjectiveIds] = useState([])
  const [createSubmitting, setCreateSubmitting] = useState(false)

  const name = isCreate ? createName : (str(field(idea, 'Idea Name', 'Idea Name')) || '')
  const description = isCreate ? createDescription : (str(field(idea, 'Idea Description', 'Idea Description')) || '')
  const category = isCreate ? createCategory : (str(field(idea, 'Category', 'Category')) || '')
  const status = isCreate ? createStatus : (str(field(idea, 'Status', 'Status')) || 'New')
  const priority = isCreate ? createPriority : (str(field(idea, 'Priority', 'Priority')) || '')
  const dateAddedStr = isCreate ? '' : ((0, toDateStr)(field(idea, 'Date Added', 'Date Added')) || '')
  const objectiveIds = isCreate ? createObjectiveIds : getObjectiveIds(idea)

  useEffect(() => {
    let cancelled = false
    fetchApi('/api/objectives')
      .then((r) => {
        if (cancelled) return
        const list = r.data || []
        setAllObjectives(list)
        if (idea) {
          const ids = getObjectiveIds(idea)
          setObjectiveItems(ids.map((id) => ({ id, name: list.find((o) => o.id === id) ? str(field(list.find((o) => o.id === id), 'Objective Name', 'Objective Name')) || '(untitled)' : '…' })))
        }
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [idea?.id, fetchApi])

  useEffect(() => {
    if (idea && allObjectives.length > 0) {
      const ids = getObjectiveIds(idea)
      setObjectiveItems(ids.map((id) => {
        const o = allObjectives.find((r) => r.id === id)
        return { id, name: o ? str(field(o, 'Objective Name', 'Objective Name')) || '(untitled)' : '…' }
      }))
    }
  }, [idea, allObjectives])

  const handleCreateSubmit = async () => {
    const ideaName = createName.trim() || '(untitled)'
    const fields = {
      'Idea Name': ideaName,
      'Idea Description': createDescription.trim() || undefined,
      Category: createCategory.trim() || undefined,
      Status: createStatus,
      Priority: createPriority.trim() || undefined,
      Objectives: createObjectiveIds.length > 0 ? createObjectiveIds : undefined,
    }
    setCreateSubmitting(true)
    try {
      await onCreate(fields)
      onClose()
    } catch (err) {
      console.error(err)
    } finally {
      setCreateSubmitting(false)
    }
  }

  const saveEdit = async (fieldName, payload) => {
    try {
      await onIdeaUpdate(idea.id, payload)
      setEditingField(null)
    } catch (err) {
      console.error(err)
    }
  }

  const handleStatusChange = async (newStatus) => {
    if (!idea) return
    await saveEdit('status', { Status: newStatus })
  }

  const startEdit = (fieldName, currentValue) => {
    setEditingField(fieldName)
    setEditValue(currentValue ?? '')
  }

  const handleBlurName = () => {
    if (editingField !== 'name') return
    const v = editValue.trim()
    saveEdit('name', { 'Idea Name': v || name || '(untitled)' })
  }
  const handleBlurDescription = () => {
    if (editingField !== 'description') return
    saveEdit('description', { 'Idea Description': editValue })
  }
  const handleBlurCategory = () => {
    if (editingField !== 'category') return
    saveEdit('category', { Category: editValue.trim() })
  }

  const handleDelete = async () => {
    if (!onIdeaDelete) return
    try {
      await onIdeaDelete(idea.id)
      onClose()
    } catch (err) {
      console.error(err)
    }
  }

  if (!idea && !onCreate) return null

  if (isCreate) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-labelledby="discovery-modal-title"
      >
        <div
          className="bg-surface rounded-2xl border-2 border-border shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-6 py-4 border-b border-border flex items-center justify-between gap-3">
            <h2 id="discovery-modal-title" className="font-bold text-xl text-text">New idea</h2>
            <button type="button" onClick={onClose} className="shrink-0 p-2 rounded-lg text-text-muted hover:bg-border text-xl leading-none" aria-label="Close">×</button>
          </div>
          <div className="px-6 py-5 overflow-y-auto flex-1 space-y-0">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-muted mb-1.5">Idea name</label>
                <input
                  type="text"
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  placeholder="Idea name"
                  className="w-full rounded-lg border border-border bg-surface text-text px-3 py-2.5"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-muted mb-1.5">Description</label>
                <textarea
                  value={createDescription}
                  onChange={(e) => setCreateDescription(e.target.value)}
                  placeholder="Idea description"
                  className="w-full rounded-lg border border-border bg-surface text-text px-3 py-2.5 min-h-[88px] resize-y"
                />
              </div>
            </div>

            <div className="border-t border-border mt-5 pt-5 space-y-4">
              <h3 className="text-sm font-medium text-text-muted">Attributes</h3>
              <div className="space-y-3">
                <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-4">
                  <label className="text-sm text-text-muted shrink-0 w-28 flex items-center gap-1.5">
                    <IconTag size={16} /> Category
                  </label>
                  <select
                    value={createCategory}
                    onChange={(e) => setCreateCategory(e.target.value)}
                    className="rounded-lg border border-border bg-surface text-text px-3 py-2 text-sm min-w-0 sm:min-w-[200px]"
                  >
                    <option value="">—</option>
                    {CATEGORY_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-4">
                  <label className="text-sm text-text-muted shrink-0 w-28">Priority</label>
                  <select
                    value={createPriority}
                    onChange={(e) => setCreatePriority(e.target.value)}
                    className="rounded-lg border border-border bg-surface text-text px-3 py-2 text-sm min-w-0 sm:min-w-[200px]"
                  >
                    <option value="">—</option>
                    {PRIORITY_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="border-t border-border mt-5 pt-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-muted mb-1.5 flex items-center gap-1.5">
                  <IconTarget size={16} /> Objectives
                </label>
                <select
                  multiple
                  value={createObjectiveIds}
                  onChange={(e) => setCreateObjectiveIds(Array.from(e.target.selectedOptions, (o) => o.value))}
                  className="w-full rounded-lg border border-border bg-surface text-text px-3 py-2 text-sm min-h-[88px] max-h-32"
                >
                  {allObjectives.map((o) => (
                    <option key={o.id} value={o.id}>
                      {str(field(o, 'Objective Name', 'Objective Name')) || '(untitled)'}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-wrap gap-2">
                {STATUS_OPTIONS.map((opt) => {
                  const isActive = createStatus === opt.value
                  const baseClasses = 'min-h-[40px] px-3 rounded-xl text-sm font-medium'
                  const activeClasses = 'bg-primary text-white'
                  const inactiveClasses = 'bg-border text-text hover:bg-border/80'
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setCreateStatus(opt.value)}
                      className={`${baseClasses} ${isActive ? activeClasses : inactiveClasses}`}
                    >
                      {opt.label}
                    </button>
                  )
                })}
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleCreateSubmit}
                  disabled={createSubmitting}
                  className="min-h-[44px] px-6 rounded-xl text-sm font-medium bg-primary text-white hover:bg-primary/90 disabled:opacity-50"
                >
                  {createSubmitting ? 'Creating…' : 'Create idea'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="discovery-modal-title"
    >
      <div
        className="bg-surface rounded-2xl border-2 border-border shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-border flex items-center justify-between gap-3">
          {editingField === 'name' ? (
            <input
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={handleBlurName}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleBlurName() } }}
              className="flex-1 min-w-0 font-bold text-xl text-text bg-surface border border-border rounded-lg px-2 py-1"
              id="discovery-modal-title"
              autoFocus
            />
          ) : (
            <h2
              id="discovery-modal-title"
              role="button"
              tabIndex={0}
              onClick={() => startEdit('name', name)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); startEdit('name', name) } }}
              className="font-bold text-xl text-text truncate flex-1 min-w-0 cursor-pointer rounded hover:bg-border/50 py-1 -mx-1 px-1"
            >
              {name || '(untitled)'}
            </h2>
          )}
          <button type="button" onClick={onClose} className="shrink-0 p-2 rounded-lg text-text-muted hover:bg-border text-xl leading-none" aria-label="Close">×</button>
        </div>
        <div className="px-6 py-4 border-b border-border">
          {objectiveItems.length > 0 && (
            <p className="text-sm text-text-muted flex items-center gap-1.5 flex-wrap">
              <IconTarget size={16} className="shrink-0" />
              {objectiveItems.map(({ id, name }) => (
                <Link key={id} to={`/objectives/${id}`} className="hover:underline">{name}</Link>
              ))}
            </p>
          )}
        </div>

        <div className="px-6 py-5 overflow-y-auto flex-1 space-y-0">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-muted mb-1.5">Description</label>
              {editingField === 'description' ? (
                <textarea
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onBlur={handleBlurDescription}
                  onKeyDown={(e) => { if (e.key === 'Escape') setEditingField(null) }}
                  className="w-full rounded-lg border border-border bg-surface text-text px-3 py-2.5 min-h-[88px] resize-y"
                  autoFocus
                />
              ) : (
                <p
                  role="button"
                  tabIndex={0}
                  onClick={() => startEdit('description', description)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); startEdit('description', description) } }}
                  className="text-text cursor-pointer rounded hover:bg-border/50 py-2 px-2 min-h-[2.5rem] whitespace-pre-wrap border border-transparent hover:border-border"
                >
                  {description || <span className="text-text-muted">Add description…</span>}
                </p>
              )}
            </div>
          </div>

          <div className="border-t border-border mt-5 pt-5 space-y-4">
            <h3 className="text-sm font-medium text-text-muted">Attributes</h3>
            <div className="space-y-3">
              <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-4">
                <label className="text-sm text-text-muted shrink-0 w-28 flex items-center gap-1.5">
                  <IconTag size={16} /> Category
                </label>
                {editingField === 'category' ? (
                  <select
                    value={editValue}
                    onChange={(e) => { const v = e.target.value; saveEdit('category', { Category: v }); setEditValue(v); setEditingField(null) }}
                    onBlur={() => setEditingField(null)}
                    className="rounded-lg border border-border bg-surface text-text px-3 py-2 text-sm min-w-0 sm:min-w-[200px]"
                    autoFocus
                  >
                    <option value="">—</option>
                    {CATEGORY_OPTIONS.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                ) : (
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={() => startEdit('category', category)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); startEdit('category', category) } }}
                    className="text-text cursor-pointer rounded hover:bg-border/50 py-2 px-2 -mx-2 min-w-0 sm:min-w-[200px]"
                  >
                    {category || '—'}
                  </span>
                )}
              </div>
              <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-4">
                <label className="text-sm text-text-muted shrink-0 w-28">Priority</label>
                <select
                  value={priority}
                  onChange={(e) => saveEdit('priority', { Priority: e.target.value })}
                  className="rounded-lg border border-border bg-surface text-text px-3 py-2 text-sm min-w-0 sm:min-w-[200px]"
                >
                  <option value="">—</option>
                  {PRIORITY_OPTIONS.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-4">
                <label className="text-sm text-text-muted shrink-0 w-28 flex items-center gap-1.5">
                  <IconCalendar size={16} /> Created date
                </label>
                <span className="text-text py-2 px-0 sm:min-w-[200px]">{dateAddedStr || '—'}</span>
              </div>
            </div>
          </div>

          <div className="border-t border-border mt-5 pt-5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              {STATUS_OPTIONS.map((opt) => {
                const isActive = status === opt.value
                const baseClasses = 'min-h-[36px] px-3 rounded-xl text-sm font-medium'
                const activeClasses = 'bg-primary text-white'
                const inactiveClasses = 'bg-border text-text hover:bg-border/80'
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleStatusChange(opt.value)}
                    className={`${baseClasses} ${isActive ? activeClasses : inactiveClasses}`}
                  >
                    {opt.label}
                  </button>
                )
              })}
            </div>
            {onIdeaDelete && (
              <button
                type="button"
                onClick={handleDelete}
                className="min-h-[36px] px-3 rounded-xl text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-500/10 inline-flex items-center gap-2"
              >
                <IconTrash size={18} /> Delete
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
