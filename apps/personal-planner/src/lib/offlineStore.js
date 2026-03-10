/**
 * IndexedDB-backed offline store: cache of API responses and queue of pending mutations.
 * Used for offline-first data and sync when back online.
 */

const DB_NAME = 'mosco-planner-offline'
const DB_VERSION = 1
const STORE_CACHE = 'cache'
const STORE_PENDING = 'pendingMutations'

function isIDBAvailable() {
  return typeof indexedDB !== 'undefined'
}

/**
 * @returns {Promise<IDBDatabase | null>}
 */
export function openDB() {
  if (!isIDBAvailable()) return Promise.resolve(null)
  return new Promise((resolve, reject) => {
    try {
      const req = indexedDB.open(DB_NAME, DB_VERSION)
      req.onerror = () => reject(req.error)
      req.onsuccess = () => resolve(req.result)
      req.onupgradeneeded = (e) => {
        const db = e.target.result
        if (!db.objectStoreNames.contains(STORE_CACHE)) {
          db.createObjectStore(STORE_CACHE, { keyPath: 'path' })
        }
        if (!db.objectStoreNames.contains(STORE_PENDING)) {
          const store = db.createObjectStore(STORE_PENDING, { keyPath: 'id', autoIncrement: true })
          store.createIndex('byTimestamp', 'clientTimestamp', { unique: false })
        }
      }
    } catch (err) {
      reject(err)
    }
  })
}

/**
 * @param {string} path - e.g. /api/tasks or /api/tasks/recXXX
 * @returns {Promise<{ data: unknown, timestamp: number } | null>}
 */
export async function getCached(path) {
  try {
    const db = await openDB()
    if (!db) return null
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_CACHE, 'readonly')
      const req = tx.objectStore(STORE_CACHE).get(path)
      req.onsuccess = () => resolve(req.result ?? null)
      req.onerror = () => reject(req.error)
    })
  } catch {
    return null
  }
}

/**
 * @param {string} path
 * @param {unknown} data
 */
export async function setCached(path, data) {
  try {
    const db = await openDB()
    if (!db) return
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_CACHE, 'readwrite')
      tx.objectStore(STORE_CACHE).put({ path, data, timestamp: Date.now() })
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  } catch {
    // no-op when IDB unavailable
  }
}

/**
 * Resource prefix: /api/tasks/123 -> /api/tasks; /api/tasks -> /api/tasks
 * @param {string} pathOrPrefix
 */
export function getResourcePrefix(pathOrPrefix) {
  const base = (pathOrPrefix || '').split('?')[0]
  const parts = base.split('/').filter(Boolean)
  if (parts.length >= 3) return '/' + parts.slice(0, 2).join('/')
  return base.startsWith('/') ? base : '/' + base
}

/**
 * Invalidate cache entries whose path equals or is under the given prefix.
 * @param {string | null} pathOrPrefix - e.g. /api/tasks; if null, clear all.
 */
export async function invalidateCache(pathOrPrefix) {
  try {
    const db = await openDB()
    if (!db) return
    const prefix = pathOrPrefix ? getResourcePrefix(pathOrPrefix) : null
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_CACHE, 'readwrite')
      const store = tx.objectStore(STORE_CACHE)
      const req = store.openCursor()
      req.onsuccess = () => {
        const cursor = req.result
        if (!cursor) {
          resolve()
          return
        }
        const path = cursor.value?.path
        if (!prefix || path === prefix || (path && path.startsWith(prefix + '/'))) {
          cursor.delete()
        }
        cursor.continue()
      }
      req.onerror = () => reject(req.error)
      tx.oncomplete = () => resolve()
    })
  } catch {
    // no-op when IDB unavailable
  }
}

/**
 * @typedef {{
 *   method: string
 *   path: string
 *   body?: unknown
 *   clientTimestamp: number
 *   resourceKey: string
 *   clientLastModified?: string
 * }} PendingMutationInput
 */

/**
 * @typedef {PendingMutationInput & { id: number }} PendingMutation
 */

/**
 * @param {PendingMutationInput} mutation
 * @returns {Promise<number>} id of the added mutation
 */
export async function addPendingMutation(mutation) {
  try {
    const db = await openDB()
    if (!db) return 0
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_PENDING, 'readwrite')
      const req = tx.objectStore(STORE_PENDING).add({
        method: mutation.method,
        path: mutation.path,
        body: mutation.body,
        clientTimestamp: mutation.clientTimestamp,
        resourceKey: mutation.resourceKey,
        clientLastModified: mutation.clientLastModified,
      })
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => reject(req.error)
    })
  } catch {
    return 0
  }
}

/**
 * @returns {Promise<PendingMutation[]>}
 */
export async function getAllPendingMutations() {
  try {
    const db = await openDB()
    if (!db) return []
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_PENDING, 'readonly')
      const req = tx.objectStore(STORE_PENDING).getAll()
      req.onsuccess = () => {
        const list = req.result || []
        list.sort((a, b) => (a.clientTimestamp || 0) - (b.clientTimestamp || 0))
        resolve(list)
      }
      req.onerror = () => reject(req.error)
    })
  } catch {
    return []
  }
}

/**
 * @param {number} id
 */
export async function removePendingMutation(id) {
  try {
    const db = await openDB()
    if (!db) return
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_PENDING, 'readwrite')
      tx.objectStore(STORE_PENDING).delete(id)
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  } catch {
    // no-op when IDB unavailable
  }
}
