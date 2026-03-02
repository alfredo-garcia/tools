import { useState, useEffect, useCallback } from 'react'
import { field, dateStr, isPastDue } from '@tools/shared'
import { usePlannerApi } from '../contexts/PlannerApiContext'
import { getTaskStatusGroup } from '../lib/taskStatus'

function getDue(t) {
  return dateStr(field(t, 'Due Date', 'Due Date'))
}

/**
 * Returns whether the user has any past-due tasks (due date before today, not done).
 * Fetches tasks on mount and on window focus so the nav badge stays up to date.
 * @returns {{ hasPastDue: boolean, loading: boolean }}
 */
export function usePastDueTasks() {
  const { fetchApi } = usePlannerApi()
  const [hasPastDue, setHasPastDue] = useState(false)
  const [loading, setLoading] = useState(true)

  const refetch = useCallback(() => {
    return fetchApi('/api/tasks')
      .then((r) => {
        const list = r.data || []
        const any = list.some((t) => {
          const due = getDue(t)
          return due && isPastDue(due) && getTaskStatusGroup(t) !== 'done'
        })
        setHasPastDue(any)
      })
      .catch(() => setHasPastDue(false))
      .finally(() => setLoading(false))
  }, [fetchApi])

  useEffect(() => {
    refetch()
  }, [refetch])

  useEffect(() => {
    const onFocus = () => refetch()
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [refetch])

  return { hasPastDue, loading }
}
