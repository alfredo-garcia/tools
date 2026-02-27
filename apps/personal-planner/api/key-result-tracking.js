import { validateAccess } from './_lib/auth.js'
import { fetchTable, createRecord, updateRecord } from './_lib/airtable.js'

const TABLE = process.env.AIRTABLE_TABLE_KEY_RESULT_TRACKING || 'Key Results Tracking'

function getPathSegments(pathname) {
  return (pathname || '').replace(/^\/api\/key-result-tracking/, '').split('/').filter(Boolean)
}

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json')
  const auth = validateAccess(req)
  if (!auth.valid) {
    res.statusCode = auth.status
    res.end(JSON.stringify(auth.body))
    return
  }
  const pathname = req.url || ''
  const segments = getPathSegments(pathname)
  const keyResultId = req.query?.keyResultId ?? req.query?.key_result_id

  if (req.method === 'POST' && segments.length === 0) {
    if (process.env.ENABLE_KEY_RESULT_TRACKING === 'false' || process.env.ENABLE_KEY_RESULT_TRACKING === '0') {
      res.statusCode = 200
      res.end(JSON.stringify({ data: null, skipped: true }))
      return
    }
    const body = req.body || {}
    const krId = body['Key Result'] ?? body.keyResultId ?? body.key_result_id
    const krIdResolved = Array.isArray(krId) ? krId[0] : krId
    if (!krIdResolved || typeof krIdResolved !== 'string' || !krIdResolved.trim()) {
      res.statusCode = 400
      res.end(JSON.stringify({ error: 'Body must include "Key Result" (record id) or keyResultId' }))
      return
    }
    const dateRaw = body.Date ?? body.date
    const dateStr = dateRaw != null ? String(dateRaw).trim().slice(0, 10) : null
    if (!dateStr || Number.isNaN(new Date(dateStr + 'T12:00:00').getTime())) {
      res.statusCode = 400
      res.end(JSON.stringify({ error: 'Body must include Date (YYYY-MM-DD) or date' }))
      return
    }
    const value = body['Current Value'] ?? body.value ?? body.currentValue
    const numValue = value === '' || value == null ? null : (typeof value === 'number' ? value : Number(value))
    if (numValue != null && Number.isNaN(numValue)) {
      res.statusCode = 400
      res.end(JSON.stringify({ error: '"Current Value" must be a number' }))
      return
    }
    const progressRaw = body['Progress (%)'] ?? body.progress ?? body['Progress %']
    const progressNum = progressRaw === '' || progressRaw == null ? null : (typeof progressRaw === 'number' ? progressRaw : Number(progressRaw))
    const progressPct = (progressNum != null && !Number.isNaN(progressNum)) ? Math.min(100, Math.max(0, Math.round(progressNum))) : null

    const krIdTrimmed = krIdResolved.trim()
    const fields = {
      'Key Result': [krIdTrimmed],
      Date: dateStr,
    }
    if (numValue != null) fields['Current Value'] = numValue
    if (progressPct != null) fields['Progress (%)'] = progressPct

    const updatePayload = {}
    if (numValue != null) updatePayload['Current Value'] = numValue
    if (progressPct != null) updatePayload['Progress (%)'] = progressPct

    try {
      const all = await fetchTable(TABLE, 5000)
      const dateNorm = (d) => (d == null ? '' : String(d).slice(0, 10))
      const existing = all.find((r) => {
        const link = r['Key Result']
        const ids = Array.isArray(link) ? link : link != null ? [link] : []
        return ids.includes(krIdTrimmed) && dateNorm(r['Date']) === dateStr
      })

      if (existing) {
        const updated = await updateRecord(TABLE, existing.id, updatePayload)
        res.statusCode = 200
        res.end(JSON.stringify({ data: updated }))
      } else {
        const created = await createRecord(TABLE, fields)
        res.statusCode = 201
        res.end(JSON.stringify({ data: created }))
      }
    } catch (err) {
      if (err.error === 'INVALID_VALUE_FOR_COLUMN' && String(err.message || '').includes('Key Result')) {
        try {
          const fallback = { ...fields, 'Key Result': krIdTrimmed }
          const created = await createRecord(TABLE, fallback)
          res.statusCode = 201
          res.end(JSON.stringify({ data: created }))
          return
        } catch (err2) {
          console.error('key-result-tracking POST error (fallback):', err2)
          res.statusCode = 500
          res.end(JSON.stringify({ error: err2.message }))
          return
        }
      }
      console.error('key-result-tracking POST error:', err)
      res.statusCode = err.statusCode === 404 ? 404 : 500
      res.end(JSON.stringify({ error: err.message }))
    }
    return
  }

  if (req.method !== 'GET') {
    res.statusCode = 405
    res.end(JSON.stringify({ error: 'Method not allowed' }))
    return
  }

  try {
    let data = await fetchTable(TABLE, 1000)
    if (keyResultId && keyResultId.trim()) {
      const id = keyResultId.trim()
      data = data.filter((r) => {
        const link = r['Key Result']
        const ids = Array.isArray(link) ? link : link != null ? [link] : []
        return ids.includes(id)
      })
    }
    res.statusCode = 200
    res.end(JSON.stringify({ data }))
  } catch (err) {
    console.error('key-result-tracking error:', err)
    res.statusCode = 500
    res.end(JSON.stringify({ error: err.message }))
  }
}
