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


/**
 * Actualiza un registro por id.
 * @param {string} tableName
 * @param {string} recordId
 * @param {object} fields - Campos a actualizar (ej. { Status: 'Done' })
 * @returns {Promise<{ id: string, ...fields }>}
 */
export function updateRecord(tableName, recordId, fields) {
  const base = getBase()
  if (!base) return Promise.reject(new Error('Airtable no configurado'))
  return base(tableName)
    .update(recordId, fields)
    .then((r) => ({ id: r.id, ...r.fields }))
}

/**
 * Crea un registro.
 * @param {string} tableName
 * @param {object} fields - Campos del nuevo registro
 * @returns {Promise<{ id: string, ...fields }>}
 */
export function createRecord(tableName, fields) {
  const base = getBase()
  if (!base) return Promise.reject(new Error('Airtable no configurado'))
  return base(tableName)
    .create(fields)
    .then((r) => ({ id: r.id, ...r.fields }))
}

/**
 * Elimina un registro por id.
 * @param {string} tableName
 * @param {string} recordId
 * @returns {Promise<void>}
 */
export function deleteRecord(tableName, recordId) {
  const base = getBase()
  if (!base) return Promise.reject(new Error('Airtable no configurado'))
  return base(tableName).destroy(recordId)
}
