import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Spinner, PageHeader, EntityDetailPage } from '@tools/shared'
import { usePlannerApi } from '../contexts/PlannerApiContext'

const OBJECTIVE_QUERY = `
  query Objective($id: ID!) { objective(id: $id) { id objectiveName status description category priority startDate targetDate lastModified } }
`

export function ObjectiveDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { graphql } = usePlannerApi()
  const [objective, setObjective] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    if (!id) return
    setLoading(true)
    setError(null)
    try {
      const data = await graphql(OBJECTIVE_QUERY, { id })
      setObjective(data?.objective ?? null)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [graphql, id])

  useEffect(() => {
    load()
  }, [load])

  if (loading && !objective) {
    return (
      <div className="flex flex-col items-center gap-4 py-12">
        <Spinner />
        <p className="text-text-muted">Loading objective…</p>
      </div>
    )
  }

  if (!objective) {
    return (
      <EntityDetailPage header={<PageHeader title="Objective" onBack={() => navigate('/objectives')} />}>
        <p className="text-text-muted">{error || 'Objective not found.'}</p>
      </EntityDetailPage>
    )
  }

  return (
    <EntityDetailPage header={<PageHeader title={objective.objectiveName || 'Objective'} onBack={() => navigate('/objectives')} />}>
      {error && <p className="text-red-600 dark:text-red-400 text-sm mb-4" role="alert">{error}</p>}
      <dl className="space-y-2 text-sm">
        {objective.status && <><dt className="text-text-muted">Status</dt><dd>{objective.status}</dd></>}
        {objective.startDate && <><dt className="text-text-muted">Start</dt><dd>{objective.startDate}</dd></>}
        {objective.targetDate && <><dt className="text-text-muted">Target</dt><dd>{objective.targetDate}</dd></>}
        {objective.description && <><dt className="text-text-muted">Description</dt><dd className="whitespace-pre-wrap">{objective.description}</dd></>}
      </dl>
    </EntityDetailPage>
  )
}
