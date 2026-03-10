import { createContext, useCallback, useRef, useContext, useState, useEffect } from 'react'
import { useAuth } from '@tools/shared'
import {
  getCached,
  setCached,
  invalidateCache as idbInvalidateCache,
  getResourcePrefix,
  addPendingMutation,
  getAllPendingMutations,
  removePendingMutation,
} from '../lib/offlineStore.js'

const AUTH_HEADER = 'Authorization'
const ONE_DAY_MS = 24 * 60 * 60 * 1000
const CACHE_TTL_MS = ONE_DAY_MS

export const PlannerApiContext = createContext(null)

/**
 * Extract record id from path: /api/tasks/recXXX -> recXXX
 */
function getRecordIdFromPath(path) {
  const parts = (path || '').split('?')[0].split('/').filter(Boolean)
  return parts.length >= 3 ? parts[2] : null
}

export function PlannerApiProvider({ children }) {
  const { getAccessCode } = useAuth()
  const memoryCacheRef = useRef(new Map())
  const [isOnline, setIsOnline] = useState(() => (typeof navigator !== 'undefined' ? navigator.onLine : true))
  const [isSyncing, setIsSyncing] = useState(false)
  const [pendingCount, setPendingCount] = useState(0)
  const [conflictCount, setConflictCount] = useState(0)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const refreshPendingCount = useCallback(async () => {
    try {
      const list = await getAllPendingMutations()
      setPendingCount(list.length)
    } catch {
      setPendingCount(0)
    }
  }, [])

  useEffect(() => {
    refreshPendingCount()
  }, [refreshPendingCount, isOnline])

  const invalidateCache = useCallback((pathOrPrefix) => {
    const prefix = pathOrPrefix ? getResourcePrefix(pathOrPrefix) : null
    const cache = memoryCacheRef.current
    if (!prefix) {
      cache.clear()
      idbInvalidateCache(null).catch(() => {})
      return
    }
    for (const key of cache.keys()) {
      const keyPath = key.split('?')[0]
      if (keyPath === prefix || keyPath.startsWith(prefix + '/')) cache.delete(key)
    }
    idbInvalidateCache(pathOrPrefix).catch(() => {})
  }, [])

  const doNetworkFetch = useCallback(
    async (path, options = {}) => {
      const headers = {
        [AUTH_HEADER]: getAccessCode(),
        'Content-Type': 'application/json',
        ...options.headers,
      }
      const res = await fetch(path, { ...options, headers })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        const err = new Error(data.error ?? 'Error en la petición')
        err.status = res.status
        err.data = data
        throw err
      }
      return data
    },
    [getAccessCode]
  )

  /**
   * Apply optimistic update to local cache for an offline mutation.
   */
  const applyOptimisticUpdate = useCallback(async (method, path, body) => {
    const resourceKey = getResourcePrefix(path)
    const recordId = getRecordIdFromPath(path)
    try {
      const cached = await getCached(resourceKey)
      if (!cached?.data) return
      const payload = cached.data
      const list = Array.isArray(payload?.data) ? payload.data : Array.isArray(payload) ? payload : null
      if (!list) return

      if (method === 'PATCH' && recordId && body && typeof body === 'object') {
        const next = list.map((item) =>
          item.id === recordId ? { ...item, ...body } : item
        )
        await setCached(resourceKey, { ...payload, data: next })
        memoryCacheRef.current.set(resourceKey, { data: { ...payload, data: next }, timestamp: Date.now() })
      } else if (method === 'DELETE' && recordId) {
        const next = list.filter((item) => item.id !== recordId)
        await setCached(resourceKey, { ...payload, data: next })
        memoryCacheRef.current.set(resourceKey, { data: { ...payload, data: next }, timestamp: Date.now() })
      } else if (method === 'POST' && body && typeof body === 'object') {
        const tempId = 'temp-' + Date.now()
        const newItem = { id: tempId, ...body }
        const next = [...list, newItem]
        await setCached(resourceKey, { ...payload, data: next })
        memoryCacheRef.current.set(resourceKey, { data: { ...payload, data: next }, timestamp: Date.now() })
      }
    } catch {
      // best-effort optimistic update
    }
  }, [])

  const processPendingQueue = useCallback(async () => {
    if (!isOnline) return
    setIsSyncing(true)
    let conflicts = 0
    try {
      const list = await getAllPendingMutations()
      for (const mut of list) {
        try {
          const body =
            mut.method === 'PATCH' && mut.body
              ? { ...mut.body, clientLastModified: mut.clientLastModified }
              : mut.body
          const opts = {
            method: mut.method,
            ...(body != null && (mut.method === 'POST' || mut.method === 'PATCH') && { body: JSON.stringify(body) }),
          }
          const data = await doNetworkFetch(mut.path, opts)
          await removePendingMutation(mut.id)
          if (mut.method === 'GET' || mut.method === 'POST' || mut.method === 'PATCH') {
            const resKey = getResourcePrefix(mut.path)
            invalidateCache(resKey)
            if (mut.method === 'PATCH' && data?.data) {
              await setCached(mut.path, { data: data.data, timestamp: Date.now() })
            }
          } else {
            invalidateCache(mut.resourceKey)
          }
        } catch (err) {
          if (err?.status === 409) {
            conflicts++
            await removePendingMutation(mut.id)
            invalidateCache(mut.resourceKey)
          }
          // else leave in queue for next sync
        }
      }
      if (conflicts > 0) setConflictCount((c) => c + conflicts)
      await refreshPendingCount()
    } catch {
      // never let IDB or network errors crash the app
    } finally {
      setIsSyncing(false)
    }
  }, [isOnline, doNetworkFetch, invalidateCache, refreshPendingCount])

  useEffect(() => {
    if (!isOnline) return
    // Defer sync so first paint completes and we don't block or race with initial IDB reads
    const t = setTimeout(() => {
      processPendingQueue()
    }, 100)
    return () => clearTimeout(t)
  }, [isOnline, processPendingQueue])

  const fetchApi = useCallback(
    async (path, options = {}) => {
      const method = (options.method || 'GET').toUpperCase()
      const isGet = method === 'GET'
      const memoryCache = memoryCacheRef.current

      if (isGet) {
        const now = Date.now()
        // When online: always try network first (network-first) so first load gets fresh data.
        // When offline: use cache (memory then IDB).
        if (!isOnline) {
          const mem = memoryCache.get(path)
          if (mem && now - mem.timestamp < CACHE_TTL_MS) {
            return mem.data
          }
          try {
            const idb = await getCached(path)
            if (idb?.data != null) {
              memoryCache.set(path, { data: idb.data, timestamp: idb.timestamp || now })
              return idb.data
            }
          } catch {
            // ignore
          }
        }
        // Online: skip cache for GET, go straight to network below (cache used only on network failure)
      }

      if (!isOnline && !isGet) {
        const resourceKey = getResourcePrefix(path)
        const recordId = getRecordIdFromPath(path)
        let clientLastModified
        if (method === 'PATCH' && recordId) {
          try {
            const cached = await getCached(path)
            if (cached?.data?.data?.lastModified) clientLastModified = cached.data.data.lastModified
            else {
              const listCached = await getCached(resourceKey)
              const list = listCached?.data?.data ?? listCached?.data
              const item = Array.isArray(list) ? list.find((i) => i.id === recordId) : null
              if (item?.lastModified) clientLastModified = item.lastModified
            }
          } catch {
            // ignore
          }
        }
        const body = options.body ? (typeof options.body === 'string' ? JSON.parse(options.body) : options.body) : undefined
        await addPendingMutation({
          method,
          path,
          body,
          clientTimestamp: Date.now(),
          resourceKey,
          clientLastModified,
        })
        await applyOptimisticUpdate(method, path, body)
        await refreshPendingCount()
        if (method === 'POST') return { data: { id: 'temp-' + Date.now(), ...body } }
        if (method === 'PATCH') return { data: { id: recordId, ...body } }
        if (method === 'DELETE') return { deleted: recordId }
        return {}
      }

      try {
        const data = await doNetworkFetch(path, options)
        if (isGet) {
          memoryCache.set(path, { data, timestamp: Date.now() })
          setCached(path, { data, timestamp: Date.now() }).catch(() => {})
        } else {
          invalidateCache(path)
        }
        return data
      } catch (err) {
        if (isGet) {
          try {
            const mem = memoryCache.get(path)
            if (mem?.data != null) return mem.data
            const idb = await getCached(path)
            if (idb?.data != null) {
              memoryCache.set(path, { data: idb.data, timestamp: idb.timestamp || Date.now() })
              return idb.data
            }
          } catch {
            // ignore
          }
        }
        if (!isOnline || err.message?.includes('Failed to fetch') || err.message?.includes('NetworkError')) {
          if (!isGet) {
            const resourceKey = getResourcePrefix(path)
            const recordId = getRecordIdFromPath(path)
            let clientLastModified
            if (method === 'PATCH' && recordId) {
              try {
                const listCached = await getCached(resourceKey)
                const list = listCached?.data?.data ?? listCached?.data
                const item = Array.isArray(list) ? list.find((i) => i.id === recordId) : null
                if (item?.lastModified) clientLastModified = item.lastModified
              } catch {
                // ignore
              }
            }
            const body = options.body ? (typeof options.body === 'string' ? JSON.parse(options.body) : options.body) : undefined
            await addPendingMutation({
              method,
              path,
              body,
              clientTimestamp: Date.now(),
              resourceKey,
              clientLastModified,
            })
            await applyOptimisticUpdate(method, path, body)
            await refreshPendingCount()
            if (method === 'POST') return { data: { id: 'temp-' + Date.now(), ...body } }
            if (method === 'PATCH') return { data: { id: recordId, ...body } }
            if (method === 'DELETE') return { deleted: recordId }
            return {}
          }
        }
        throw err
      }
    },
    [
      getAccessCode,
      isOnline,
      invalidateCache,
      doNetworkFetch,
      applyOptimisticUpdate,
      refreshPendingCount,
    ]
  )

  const value = {
    fetchApi,
    invalidateCache,
    isOnline,
    isSyncing,
    pendingCount,
    conflictCount,
    setConflictCount,
    processPendingQueue,
  }
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
