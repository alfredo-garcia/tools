/**
 * Normalize field access and scalar values for API/JSON data.
 * Use when field names may vary (e.g. "Status" vs "status") or values need coercion.
 */
export function field(obj, ...keys) {
  if (!obj) return undefined
  for (const k of keys) {
    if (obj[k] !== undefined && obj[k] !== null) return obj[k]
  }
  return undefined
}

export function num(val) {
  if (val == null || val === '') return null
  const n = Number(val)
  return Number.isFinite(n) ? n : null
}

export function str(val) {
  if (val == null) return ''
  return String(val).trim()
}

export function arr(val) {
  if (Array.isArray(val)) return val
  if (val == null || val === '') return []
  return [val]
}

export function dateStr(val) {
  if (!val) return ''
  const d = typeof val === 'string' ? new Date(val) : val
  return Number.isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10)
}
