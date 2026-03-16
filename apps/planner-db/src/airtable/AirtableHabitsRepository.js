/**
 * Airtable implementation of Habits repository (read-only list).
 */
import { fetchTable } from '../lib/airtable.js'

const TABLE = process.env.AIRTABLE_TABLE_HABITS || 'Habits'

/**
 * @typedef {Object} HabitsRepository
 * @property {() => Promise<Object[]>} list
 */

/** @returns {HabitsRepository} */
export function createAirtableHabitsRepository() {
  return {
    async list() {
      const data = await fetchTable(TABLE)
      return Array.isArray(data) ? data : []
    },
  }
}
