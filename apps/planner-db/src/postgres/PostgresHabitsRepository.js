import { query } from '../lib/pg.js'

function rowToRecord(r) {
  if (!r) return null
  const lastModified = r.last_modified && (typeof r.last_modified.toISOString === 'function' ? r.last_modified.toISOString() : r.last_modified)
  return { id: r.id, Name: r.name, Description: r.description, Frequency: r.frequency, lastModified }
}

/** @returns {import('../interfaces.js').HabitsRepository} */
export function createPostgresHabitsRepository() {
  return {
    async list() {
      const res = await query('SELECT * FROM habits ORDER BY last_modified DESC')
      return (res.rows || []).map(rowToRecord)
    },
  }
}
