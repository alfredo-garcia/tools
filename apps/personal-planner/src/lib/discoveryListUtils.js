/**
 * Helpers for Discovery list filtering and status labels.
 * Status values match Airtable "Discovery Ideas" Status; _open = all except Archived.
 */

export const STATUS_OPTIONS = [
  { value: '', label: 'All' },
  { value: '_open', label: 'All open' },
  { value: 'New', label: 'Parking lot' },
  { value: 'Under Review', label: 'Discovery' },
  { value: 'Explored', label: 'Done' },
  { value: 'Archived', label: 'Archived' },
]

export function getStatusLabel(statusValue) {
  const opt = STATUS_OPTIONS.find((o) => o.value === statusValue)
  return opt ? opt.label : statusValue
}

/**
 * Filter ideas by status. statusFilter: '' = all, '_open' = exclude Archived, else exact match.
 * @param {Array} list - discovery ideas (with fields)
 * @param {string} statusFilter
 * @param {function} getStatus - (idea) => status string
 */
export function filterByStatus(list, statusFilter, getStatus) {
  if (!list?.length) return list
  if (statusFilter === '_open') {
    return list.filter((i) => getStatus(i) !== 'Archived')
  }
  if (statusFilter === '') return list
  return list.filter((i) => getStatus(i) === statusFilter)
}

/**
 * Filter ideas by search query (name, description, category).
 * @param {Array} list
 * @param {string} searchQuery - trimmed, case-insensitive match
 * @param {function} getFields - (idea) => ({ name, description, category })
 */
export function filterBySearch(list, searchQuery, getFields) {
  if (!searchQuery) return list
  const q = searchQuery.trim().toLowerCase()
  if (!q) return list
  return list.filter((i) => {
    const { name = '', description = '', category = '' } = getFields(i)
    return (
      name.toLowerCase().includes(q) ||
      description.toLowerCase().includes(q) ||
      category.toLowerCase().includes(q)
    )
  })
}
