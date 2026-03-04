import Airtable from 'airtable'

export function getBase() {
  const pat = process.env.AIRTABLE_PAT
  const baseId = process.env.AIRTABLE_BASE_ID
  if (!pat || !baseId) return null
  return new Airtable({ apiKey: pat }).base(baseId)
}

/** Base opcional para Shopping List (otra base). Usa AIRTABLE_BASE_ID_SHOPPING si está definido, si no AIRTABLE_BASE_ID. */
export function getShoppingBase() {
  const pat = process.env.AIRTABLE_PAT
  const baseId = process.env.AIRTABLE_BASE_ID_SHOPPING || process.env.AIRTABLE_BASE_ID
  if (!pat || !baseId) return null
  return new Airtable({ apiKey: pat }).base(baseId)
}

/** Base opcional para Recipes (Recipes, Ingredients, Recipe Ingredients). Usa AIRTABLE_BASE_ID_RECIPES. */
export function getRecipesBase() {
  const pat = process.env.AIRTABLE_PAT
  const baseId = process.env.AIRTABLE_BASE_ID_RECIPES
  if (!pat || !baseId) return null
  return new Airtable({ apiKey: pat }).base(baseId)
}

/**
 * Lee todos los registros de una tabla (máx 500).
 * @param {object} [baseOverride] - Si se pasa (p. ej. getShoppingBase()), se usa en lugar de la base por defecto.
 */
export function fetchTable(tableName, maxRecords = 500, baseOverride = null) {
  const base = baseOverride || getBase()
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
 * @param {object} [baseOverride] - Si se pasa (p. ej. getShoppingBase()), se usa en lugar de la base por defecto.
 * @returns {Promise<{ id: string, ...fields }>}
 */
export function updateRecord(tableName, recordId, fields, baseOverride = null) {
  const base = baseOverride || getBase()
  if (!base) return Promise.reject(new Error('Airtable no configurado'))
  return base(tableName)
    .update(recordId, fields)
    .then((r) => ({ id: r.id, ...r.fields }))
}

/**
 * Crea un registro.
 * @param {string} tableName
 * @param {object} fields - Campos del nuevo registro
 * @param {object} [baseOverride] - Si se pasa (p. ej. getShoppingBase()), se usa en lugar de la base por defecto.
 * @returns {Promise<{ id: string, ...fields }>}
 */
export function createRecord(tableName, fields, baseOverride = null) {
  const base = baseOverride || getBase()
  if (!base) return Promise.reject(new Error('Airtable no configurado'))
  return base(tableName)
    .create(fields)
    .then((r) => ({ id: r.id, ...r.fields }))
}

/**
 * Elimina un registro por id.
 * @param {string} tableName
 * @param {string} recordId
 * @param {object} [baseOverride] - Si se pasa (p. ej. getShoppingBase(), getRecipesBase()), se usa en lugar de la base por defecto.
 * @returns {Promise<void>}
 */
export function deleteRecord(tableName, recordId, baseOverride = null) {
  const base = baseOverride || getBase()
  if (!base) return Promise.reject(new Error('Airtable no configurado'))
  return base(tableName).destroy(recordId)
}
