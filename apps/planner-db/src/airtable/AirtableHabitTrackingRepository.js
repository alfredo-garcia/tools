/**
 * Airtable implementation of Habit Tracking repository.
 */
import { fetchTable, createRecord, updateRecord, deleteRecord, checkConflict } from '../lib/airtable.js'

const TABLE = process.env.AIRTABLE_TABLE_HABIT_TRACKING || 'Habit Tracking'

/**
 * @typedef {Object} HabitTrackingRepository
 * @property {() => Promise<Object[]>} list
 * @property {(input: { habitId: string, date: string }) => Promise<Object>} create
 * @property {(id: string, fields: { wasSuccessful: boolean }, opts?: { clientLastModified?: string }) => Promise<Object>} update
 * @property {(id: string) => Promise<void>} delete
 */

/** @returns {HabitTrackingRepository} */
export function createAirtableHabitTrackingRepository() {
  return {
    async list() {
      const data = await fetchTable(TABLE, 1000)
      return Array.isArray(data) ? data : []
    },

    async create({ habitId, date }) {
      const habitIdTrimmed = typeof habitId === 'string' ? habitId.trim() : null
      if (!habitIdTrimmed) throw new Error('Habit id is required')
      const d = new Date(date)
      if (Number.isNaN(d.getTime())) throw new Error('date must be YYYY-MM-DD')
      const isoDate = d.toISOString().slice(0, 10) + 'T12:00:00.000Z'
      try {
        return await createRecord(TABLE, {
          Habit: [habitIdTrimmed],
          'Execution Date-Time': isoDate,
          'Was Successful?': true,
        })
      } catch (err) {
        if (err.error === 'INVALID_VALUE_FOR_COLUMN' && String(err.message || '').includes('Habit')) {
          return await createRecord(TABLE, {
            Habit: habitIdTrimmed,
            'Execution Date-Time': isoDate,
            'Was Successful?': true,
          })
        }
        throw err
      }
    },

    async update(id, { wasSuccessful }, opts = {}) {
      if (opts.clientLastModified) {
        const conflict = await checkConflict(TABLE, id, opts.clientLastModified)
        if (conflict.conflict) {
          const err = new Error('Conflict')
          err.statusCode = 409
          err.serverLastModified = conflict.serverLastModified
          throw err
        }
      }
      return await updateRecord(TABLE, id, { 'Was Successful?': wasSuccessful })
    },

    async delete(id) {
      await deleteRecord(TABLE, id)
    },
  }
}
