/**
 * Validates access token from Authorization header (e.g. Bearer <code> or just <code>).
 * Used in GraphQL context to require auth for all operations.
 */
export function validateAccess(request) {
  const expected = process.env.APP_ACCESS_CODE
  if (!expected) {
    return { valid: false, status: 500, body: { error: 'APP_ACCESS_CODE not configured.' } }
  }
  const raw = (request?.headers?.authorization || request?.headers?.Authorization || '').trim()
  const code = raw.replace(/^Bearer\s+/i, '').trim()
  if (!code) {
    return { valid: false, status: 401, body: { error: 'Access code required.' } }
  }
  if (code !== expected) {
    return { valid: false, status: 403, body: { error: 'Incorrect code.' } }
  }
  return { valid: true, code }
}
