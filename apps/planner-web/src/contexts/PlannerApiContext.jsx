import { createContext, useContext, useCallback, useState } from 'react'
import { useAuth } from '@tools/shared'

const PlannerApiContext = createContext(null)

const graphqlUrl = import.meta.env.VITE_PLANNER_API_URL
  ? `${import.meta.env.VITE_PLANNER_API_URL}/graphql`
  : '/graphql'

export function PlannerApiProvider({ children }) {
  const { getAccessCode } = useAuth()

  const graphql = useCallback(
    async (query, variables = {}) => {
      let res
      try {
        res = await fetch(graphqlUrl, {
          method: 'POST',
          headers: {
            Authorization: getAccessCode(),
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ query, variables }),
        })
      } catch (networkErr) {
        const msg =
          networkErr.message?.includes('Failed to fetch') || networkErr.message?.includes('NetworkError')
            ? 'API not found. Is planner-api running? Start it with: cd apps/planner-api && npm start. If planner-api runs on another port, restart Vite with: API_PORT=3009 npm run dev (or set VITE_PLANNER_API_URL).'
            : networkErr.message || 'Network error'
        throw new Error(msg)
      }
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        const message =
          json.errors?.[0]?.message ??
          json.error?.message ??
          json.message ??
          (res.status === 500 || res.status === 502
            ? 'Server error. Ensure planner-api is running and Airtable env (AIRTABLE_PAT, AIRTABLE_BASE_ID) is set.'
            : 'Request failed')
        const err = new Error(message)
        err.status = res.status
        err.data = json
        throw err
      }
      if (json.errors?.length) {
        const err = new Error(json.errors[0].message ?? 'GraphQL error')
        err.data = json
        throw err
      }
      return json.data
    },
    [getAccessCode]
  )

  const value = { graphql, getAccessCode }
  return <PlannerApiContext.Provider value={value}>{children}</PlannerApiContext.Provider>
}

export function usePlannerApi() {
  const ctx = useContext(PlannerApiContext)
  if (!ctx) throw new Error('usePlannerApi must be used within PlannerApiProvider')
  return ctx
}
