import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Spinner, PageHeader, EntityDetailPage } from '@tools/shared'
import { usePlannerApi } from '../contexts/PlannerApiContext'

const KEY_RESULT_QUERY = `
  query KeyResult($id: ID!) { keyResult(id: $id) { id keyResultName status description metric currentValue targetValue unit deadline progressPercent lastModified } }
`

export function KeyResultDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { graphql } = usePlannerApi()
  const [keyResult, setKeyResult] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    if (!id) return
    setLoading(true)
    setError(null)
    try {
      const data = await graphql(KEY_RESULT_QUERY, { id })
      setKeyResult(data?.keyResult ?? null)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [graphql, id])

  useEffect(() => {
    load()
  }, [load])

  if (loading && !keyResult) {
    return (
      <div className="flex flex-col items-center gap-4 py-12">
        <Spinner />
        <p className="text-text-muted">Loading key result…</p>
      </div>
    )
  }

  if (!keyResult) {
    return (
      <EntityDetailPage header={<PageHeader title="Key Result" onBack={() => navigate('/key-results')} />}>
        <p className="text-text-muted">{error || 'Key result not found.'}</p>
      </EntityDetailPage>
    )
  }

  return (
    <EntityDetailPage header={<PageHeader title={keyResult.keyResultName || 'Key Result'} onBack={() => navigate('/key-results')} />}>
      {error && <p className="text-red-600 dark:text-red-400 text-sm mb-4" role="alert">{error}</p>}
      <dl className="space-y-2 text-sm">
        {keyResult.status && <><dt className="text-text-muted">Status</dt><dd>{keyResult.status}</dd></>}
        {keyResult.metric && <><dt className="text-text-muted">Metric</dt><dd>{keyResult.metric}</dd></>}
        {(keyResult.currentValue != null || keyResult.targetValue != null) && (
          <><dt className="text-text-muted">Progress</dt><dd>{keyResult.currentValue ?? '–'} / {keyResult.targetValue ?? '–'} {keyResult.unit || ''}</dd></>
        )}
        {keyResult.deadline && <><dt className="text-text-muted">Deadline</dt><dd>{keyResult.deadline}</dd></>}
        {keyResult.description && <><dt className="text-text-muted">Description</dt><dd className="whitespace-pre-wrap">{keyResult.description}</dd></>}
      </dl>
    </EntityDetailPage>
  )
}
