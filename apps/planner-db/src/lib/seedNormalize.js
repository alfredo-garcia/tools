import { uuidFromAirtableId } from './seedIds.js'

export function asDate(v) {
  if (v == null || v === '') return null
  const s = String(v)
  const m = s.match(/^(\d{4}-\d{2}-\d{2})/)
  return m ? m[1] : null
}

export function asNumber(v) {
  if (v == null || v === '') return null
  const n = typeof v === 'number' ? v : Number(v)
  return Number.isFinite(n) ? n : null
}

export function asString(v) {
  if (v == null) return null
  if (typeof v === 'string') return v.trim() || null
  return String(v).trim() || null
}

export function asTextArray(v) {
  if (v == null) return []
  if (Array.isArray(v)) return v.map((x) => String(x).trim()).filter(Boolean)
  const s = String(v).trim()
  return s ? [s] : []
}

export function mapLinkArrayToUuids(arr) {
  const ids = asTextArray(arr)
  return ids.map(uuidFromAirtableId)
}

