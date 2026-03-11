import { useState, useEffect, useCallback } from 'react'
import { usePlannerApi } from '../contexts/PlannerApiContext'
import { Spinner } from '@tools/shared'

export function CalendarConnections() {
  const { fetchApi } = usePlannerApi()
  const [connections, setConnections] = useState([])
  const [loading, setLoading] = useState(true)
  const [disconnecting, setDisconnecting] = useState(null)

  const loadStatus = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetchApi('/api/calendar/status')
      setConnections(Array.isArray(res?.connections) ? res.connections : [])
    } catch {
      setConnections([])
    } finally {
      setLoading(false)
    }
  }, [fetchApi])

  useEffect(() => {
    loadStatus()
  }, [loadStatus])

  // After OAuth redirect, URL may have ?calendar=connected
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('calendar') === 'connected' || params.get('calendar') === 'error') {
      loadStatus()
    }
  }, [loadStatus])

  const handleConnect = (slot) => {
    const path = `/api/calendar/oauth?slot=${slot}`
    window.location.href = path
  }

  const handleDisconnect = async (slot) => {
    setDisconnecting(slot)
    try {
      await fetchApi(`/api/calendar/connections/${slot}`, { method: 'DELETE' })
      await loadStatus()
    } catch (err) {
      console.error('Disconnect error:', err)
    } finally {
      setDisconnecting(null)
    }
  }

  if (loading) {
    return (
      <div className="rounded-2xl border-2 border-border bg-surface p-6">
        <h2 className="text-base font-bold text-text mb-2">Google Calendars</h2>
        <div className="flex items-center gap-2 text-text-muted">
          <Spinner size="sm" />
          <span className="text-sm">Loading…</span>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border-2 border-border bg-surface p-6 space-y-4">
      <h2 className="text-base font-bold text-text">Google Calendars</h2>
      <p className="text-sm text-text-muted">Connect up to 3 calendars to view and create events in the Planner.</p>
      <div className="space-y-3">
        {[1, 2, 3].map((slot) => {
          const conn = connections.find((c) => c.slot === slot)
          const isConnected = !!conn
          const label = conn?.label || (isConnected ? `Calendar ${slot}` : '')
          return (
            <div
              key={slot}
              className="flex items-center justify-between gap-3 py-2 px-3 rounded-xl border border-border bg-surface"
            >
              <span className="text-sm font-medium text-text">
                Calendar {slot}
                {isConnected && label ? `: ${label}` : ''}
              </span>
              {isConnected ? (
                <button
                  type="button"
                  onClick={() => handleDisconnect(slot)}
                  disabled={disconnecting === slot}
                  className="min-h-[36px] px-3 py-1.5 rounded-lg border-2 border-border text-sm font-medium text-text hover:bg-surface disabled:opacity-50"
                >
                  {disconnecting === slot ? '…' : 'Disconnect'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleConnect(slot)}
                  className="min-h-[36px] px-3 py-1.5 rounded-lg border-2 border-primary bg-primary/10 text-primary font-medium text-sm hover:bg-primary/20"
                >
                  Connect calendar
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
