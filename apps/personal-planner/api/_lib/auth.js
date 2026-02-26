/**
 * Valida el código de acceso desde el header Authorization.
 * @param {import('http').IncomingMessage} req
 * @returns {{ valid: true, code: string } | { valid: false, status: number, body: { error: string } }}
 */
export function validateAccess(req) {
  const expected = process.env.APP_ACCESS_CODE
  if (!expected) {
    return { valid: false, status: 500, body: { error: 'APP_ACCESS_CODE no configurado.' } }
  }
  const code = (req.headers?.authorization || req.headers?.Authorization || '').trim()
  if (!code) {
    return { valid: false, status: 401, body: { error: 'Código de acceso requerido.' } }
  }
  if (code !== expected) {
    return { valid: false, status: 403, body: { error: 'Código incorrecto.' } }
  }
  return { valid: true, code }
}
