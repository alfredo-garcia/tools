/**
 * Postgres pool for planner-db. Uses DATABASE_URL (e.g. Neon connection string).
 */
import pg from 'pg'

const Pool = pg.Pool || (pg.default && pg.default.Pool)

let pool = null

export function getPool() {
  if (!pool) {
    const url = process.env.DATABASE_URL
    if (!url) throw new Error('DATABASE_URL is required for Postgres backend')
    pool = new Pool({ connectionString: url })
  }
  return pool
}

export async function query(sql, params = []) {
  const client = getPool()
  return client.query(sql, params)
}
