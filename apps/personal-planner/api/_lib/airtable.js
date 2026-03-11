import Airtable from 'airtable'

/** Normalize Airtable record to include lastModified (from "Last Modified Time" field or API metadata). */
function recordToRow(r) {
  const lastModified =
    (r.fields && r.fields['Last Modified Time']) ||
    (typeof r._rawJson !== 'undefined' && r._rawJson?.lastModifiedTime) ||
    undefined
  return { id: r.id, ...r.fields, ...(lastModified && { lastModified }) }
}

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

/** Base para tabla Settings (Key-Value). Usa AIRTABLE_BASE_ID_SETTINGS si está definido, si no la base por defecto. */
export function getSettingsBase() {
  const pat = process.env.AIRTABLE_PAT
  const baseId = process.env.AIRTABLE_BASE_ID_SETTINGS || process.env.AIRTABLE_BASE_ID
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
          pageRecords.forEach((r) => results.push(recordToRow(r)))
          next()
        },
        (err) => (err ? reject(err) : resolve(results))
      )
  })
}

/**
 * Lee un registro por id (para comprobar lastModified antes de PATCH).
 * @param {string} tableName
 * @param {string} recordId
 * @param {object} [baseOverride]
 * @returns {Promise<{ id: string, lastModified?: string, ... } | null>}
 */
export function fetchRecord(tableName, recordId, baseOverride = null) {
  const base = baseOverride || getBase()
  if (!base) return Promise.reject(new Error('Airtable no configurado'))
  return new Promise((resolve, reject) => {
    base(tableName)
      .select({ maxRecords: 1, filterByFormula: `RECORD_ID()='${recordId}'` })
      .firstPage((err, records) => {
        if (err) return reject(err)
        const r = records && records[0]
        resolve(r ? recordToRow(r) : null)
      })
  })
}

/**
 * Pure: true if server timestamp is strictly newer than client (for offline conflict detection).
 * @param {string} serverLastModified - ISO string from server
 * @param {string} clientLastModified - ISO string from client
 * @returns {boolean}
 */
export function isConflict(serverLastModified, clientLastModified) {
  if (!serverLastModified || !clientLastModified) return false
  return new Date(serverLastModified) > new Date(clientLastModified)
}

/**
 * For offline sync: if client sends clientLastModified, check that server was not updated later.
 * @returns {Promise<{ conflict: boolean, serverLastModified?: string }>}
 */
export async function checkConflict(tableName, recordId, clientLastModified, baseOverride = null) {
  if (!clientLastModified) return { conflict: false }
  const current = await fetchRecord(tableName, recordId, baseOverride)
  const serverLM = current?.lastModified
  if (!serverLM) return { conflict: false }
  if (isConflict(serverLM, clientLastModified)) {
    return { conflict: true, serverLastModified: serverLM }
  }
  return { conflict: false }
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
    .then((r) => recordToRow(r))
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
    .then((r) => recordToRow(r))
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
