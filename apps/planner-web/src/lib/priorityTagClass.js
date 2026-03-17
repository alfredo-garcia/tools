/**
 * CSS classes for priority badge (shared pattern for tasks).
 */
export function getPriorityTagClass(priority) {
  const p = (priority || '').toLowerCase()
  if (p === 'low') return 'bg-blue-500/20 text-blue-600 dark:text-blue-400'
  if (p === 'medium') return 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
  if (p === 'high') return 'bg-red-500/20 text-red-600 dark:text-red-400'
  return 'bg-border text-text-muted'
}
