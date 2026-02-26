import Airtable from 'airtable'

export function getBase() {
  const pat = process.env.AIRTABLE_PAT
  const baseId = process.env.AIRTABLE_BASE_ID
  if (!pat || !baseId) return null
  return new Airtable({ apiKey: pat }).base(baseId)
}

/**
 * Lee todos los registros de una tabla (máx 500).
 */
export function fetchTable(tableName, maxRecords = 500) {
  const base = getBase()
  if (!base) return Promise.reject(new Error('Airtable no configurado'))
  return new Promise((resolve, reject) => {
    const results = []
    base(tableName)
      .select({ maxRecords })
      .eachPage(
        (pageRecords, next) => {
          pageRecords.forEach((r) => results.push({ id: r.id, ...r.fields }))
          next()
        },
        (err) => (err ? reject(err) : resolve(results))
      )
  })
}
