import { createContext, useCallback, useRef, useContext } from 'react'
import { useAuth } from '@tools/shared'

const AUTH_HEADER = 'Authorization'
const ONE_DAY_MS = 24 * 60 * 60 * 1000
const CACHE_TTL_MS = ONE_DAY_MS // 1 día; se invalida en create/update/delete o refresh manual

const PlannerApiContext = createContext(null)

/**
 * Devuelve el prefijo de recurso para invalidar caché: /api/tasks/123 -> /api/tasks
 * Así, al hacer PATCH /api/tasks/123 se invalida GET /api/tasks y el refetch trae datos frescos.
 */
function getResourcePrefix(path) {
  const base = path.split('?')[0]
  const parts = base.split('/').filter(Boolean)
  // /api/tasks/123 -> /api/tasks (colección); /api/tasks -> /api/tasks
  if (parts.length >= 3) return '/' + parts.slice(0, 2).join('/')
  return base
}

export function PlannerApiProvider({ children }) {
  const { getAccessCode } = useAuth()
  const cacheRef = useRef(new Map())

  const invalidateCache = useCallback((pathOrPrefix) => {
    const prefix = pathOrPrefix ? getResourcePrefix(pathOrPrefix) : null
    const cache = cacheRef.current
    if (!prefix) {
      cache.clear()
      return
    }
    for (const key of cache.keys()) {
      const keyPath = key.split('?')[0]
      if (keyPath === prefix || keyPath.startsWith(prefix + '/')) cache.delete(key)
    }
  }, [])

  const fetchApi = useCallback(async (path, options = {}) => {
    const method = (options.method || 'GET').toUpperCase()
    const isGet = method === 'GET'
    const cache = cacheRef.current

    if (isGet) {
      const cached = cache.get(path)
      const now = Date.now()
      if (cached && now - cached.timestamp < CACHE_TTL_MS) {
        return cached.data
      }
    }

    const headers = {
      [AUTH_HEADER]: getAccessCode(),
      'Content-Type': 'application/json',
      ...options.headers,
    }
    const res = await fetch(path, { ...options, headers })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.error ?? 'Error en la petición')

    if (isGet) {
      cache.set(path, { data, timestamp: Date.now() })
    } else {
      invalidateCache(path)
    }

    return data
  }, [getAccessCode, invalidateCache])

  const value = { fetchApi, invalidateCache }
  return (
    <PlannerApiContext.Provider value={value}>
      {children}
    </PlannerApiContext.Provider>
  )
}

export function usePlannerApi() {
  const ctx = useContext(PlannerApiContext)
  if (!ctx) throw new Error('usePlannerApi must be used within PlannerApiProvider')
  return ctx
}
