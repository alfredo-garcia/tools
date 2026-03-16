import { query } from '../lib/pg.js'

function rowToRecord(r) {
  if (!r) return null
  const lastModified = r.last_modified && (typeof r.last_modified.toISOString === 'function' ? r.last_modified.toISOString() : r.last_modified)
  return {
    id: r.id,
    Habit: r.habit_id,
    'Execution Date-Time': r.execution_date_time?.toISOString?.() ?? r.execution_date_time,
    'Was Successful?': r.was_successful,
    lastModified,
  }
}

/** @returns {import('../interfaces.js').HabitTrackingRepository} */
export function createPostgresHabitTrackingRepository() {
  return {
    async list() {
      const res = await query('SELECT * FROM habit_tracking ORDER BY execution_date_time DESC')
      return (res.rows || []).map(rowToRecord)
    },
    async create({ habitId, date }) {
      const d = new Date(date)
      if (Number.isNaN(d.getTime())) throw new Error('date must be YYYY-MM-DD')
      const isoDate = d.toISOString().slice(0, 10) + 'T12:00:00.000Z'
      const res = await query(
        'INSERT INTO habit_tracking (habit_id, execution_date_time, was_successful) VALUES ($1, $2, true) RETURNING *',
        [habitId, isoDate]
      )
      return rowToRecord(res.rows[0])
    },
    async update(id, { wasSuccessful }, opts = {}) {
      if (opts.clientLastModified) {
        const res = await query('SELECT last_modified FROM habit_tracking WHERE id = $1', [id])
        const row = res.rows?.[0]
        if (row?.last_modified && new Date(row.last_modified) > new Date(opts.clientLastModified)) {
          const err = new Error('Conflict')
          err.statusCode = 409
          err.serverLastModified = row.last_modified?.toISOString?.()
          throw err
        }
      }
      const res = await query('UPDATE habit_tracking SET was_successful = $1, last_modified = NOW() WHERE id = $2 RETURNING *', [wasSuccessful, id])
      if (res.rows.length === 0) { const e = new Error('Not found'); e.statusCode = 404; throw e }
      return rowToRecord(res.rows[0])
    },
    async delete(id) {
      const res = await query('DELETE FROM habit_tracking WHERE id = $1 RETURNING id', [id])
      if (res.rowCount === 0) { const e = new Error('Not found'); e.statusCode = 404; throw e }
    },
  }
}
