/**
 * GraphQL client for planner-api. Used by planner-mobile screens.
 * Set PLANNER_API_URL (e.g. https://your-api.com) and APP_ACCESS_CODE (or pass token).
 */

const getApiUrl = () => {
  if (typeof process !== 'undefined' && process.env?.PLANNER_API_URL) return process.env.PLANNER_API_URL
  if (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_PLANNER_API_URL) return process.env.EXPO_PUBLIC_PLANNER_API_URL
  return 'http://localhost:4000'
}

const getAccessCode = () => {
  if (typeof process !== 'undefined' && process.env?.APP_ACCESS_CODE) return process.env.APP_ACCESS_CODE
  if (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_APP_ACCESS_CODE) return process.env.EXPO_PUBLIC_APP_ACCESS_CODE
  return ''
}

/**
 * Run a GraphQL query or mutation against planner-api.
 * @param {string} query - GraphQL document
 * @param {Object} [variables] - Variables
 * @param {string} [accessCode] - Override access code
 * @returns {Promise<Object>} - data from response
 */
export async function plannerGraphql(query, variables = {}, accessCode = getAccessCode()) {
  const url = `${getApiUrl().replace(/\/$/, '')}/graphql`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: accessCode || 'Bearer ' + accessCode,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, variables }),
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) {
    const err = new Error(json.error?.message ?? json.errors?.[0]?.message ?? 'Request failed')
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
}
