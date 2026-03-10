import { field, str } from '@tools/shared'

/**
 * Normalizes search query: trim and lowercase for case-insensitive matching.
 * @param {string} q - Raw query
 * @returns {string}
 */
export function normalizeQuery(q) {
  return (q || '').trim().toLowerCase()
}

/**
 * Returns true if text contains query (case-insensitive).
 * @param {string} text - Text to search in
 * @param {string} query - Normalized query (lowercase)
 * @returns {boolean}
 */
export function matchText(text, query) {
  if (!query) return false
  return (str(text) || '').toLowerCase().includes(query)
}

/**
 * Matches item that has Name and optional Name ES fields (case-insensitive).
 * Use for recipes, ingredients, shopping items, etc.
 * @param {object} item - Record with fields
 * @param {string} query - Normalized query (lowercase)
 * @param {string} [nameKey='Name'] - Field key for name (e.g. 'Name', 'Task Name')
 * @param {string} [nameESKey='Name ES'] - Field key for name in Spanish
 * @returns {boolean}
 */
export function matchNameAndNameES(item, query, nameKey = 'Name', nameESKey = 'Name ES') {
  if (!query) return false
  const name = (str(field(item, nameKey, nameKey)) || '').toLowerCase()
  const nameES = (str(field(item, nameESKey, nameESKey)) || '').toLowerCase()
  return name.includes(query) || nameES.includes(query)
}
