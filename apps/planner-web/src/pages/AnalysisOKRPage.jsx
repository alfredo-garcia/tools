import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Spinner, PageHeader, Card, CardList, StatusProgressBar } from '@tools/shared'
import { usePlannerApi } from '../contexts/PlannerApiContext'

const OKR_QUERY = `
  query { objectives { id objectiveName status } keyResults { id keyResultName status progressPercent objectiveLink } }
`

export function AnalysisOKRPage() {
  const navigate = useNavigate()
  const { graphql } = usePlannerApi()
  const [objectives, setObjectives] = useState([])
  const [keyResults, setKeyResults] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await graphql(OKR_QUERY)
      setObjectives(data?.objectives ?? [])
      setKeyResults(data?.keyResults ?? [])
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [graphql])

  useEffect(() => {
    load()
  }, [load])

  const krsByObjective = keyResults.reduce((acc, kr) => {
    const objId = (Array.isArray(kr.objectiveLink) ? kr.objectiveLink[0] : kr.objectiveLink) || '_none'
    if (!acc[objId]) acc[objId] = []
    acc[objId].push(kr)
    return acc
  }, {})

  const achievedCount = keyResults.filter((kr) => (kr.status || '').toLowerCase() === 'achieved').length
  const totalCount = keyResults.length
  const percent = totalCount > 0 ? Math.round((achievedCount / totalCount) * 100) : 0

  return (
    <div className="space-y-6">
      <PageHeader title="OKR Analysis" onRefresh={load} loading={loading} onBack={() => navigate('/analytics')} />
      {error && (
        <p className="text-red-600 dark:text-red-400 text-sm" role="alert">
          {error}
        </p>
      )}
      {loading && objectives.length === 0 ? (
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      ) : (
        <>
          <div>
            <p className="text-sm font-medium text-text mb-1">Key results achieved</p>
            <StatusProgressBar
              segments={{ done: achievedCount, pending: totalCount - achievedCount }}
              total={totalCount}
              ariaLabel="Key results achieved"
            />
          </div>
          <p className="text-sm text-text-muted">
            {achievedCount} of {totalCount} key results achieved ({percent}%)
          </p>
          <div className="space-y-4">
            {objectives.map((obj) => (
              <Card key={obj.id} title={obj.objectiveName || obj.id}>
                <ul className="mt-2 space-y-1 text-sm text-text-muted">
                  {(krsByObjective[obj.id] || []).map((kr) => (
                    <li key={kr.id}>
                      {kr.keyResultName || kr.id} — {kr.status || '—'} {kr.progressPercent != null ? `(${kr.progressPercent}%)` : ''}
                    </li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
