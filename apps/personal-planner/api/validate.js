import { validateAccess } from './_lib/auth.js'

/**
 * POST /api/validate — Valida el código de acceso (Authorization header).
 */
export default function handler(req, res) {
  res.setHeader('Content-Type', 'application/json')
  if (req.method !== 'POST') {
    res.statusCode = 405
    res.end(JSON.stringify({ error: 'Método no permitido.' }))
    return
  }
  const result = validateAccess(req)
  if (!result.valid) {
    res.statusCode = result.status
    res.end(JSON.stringify(result.body))
    return
  }
  res.statusCode = 200
  res.end(JSON.stringify({ ok: true }))
}
