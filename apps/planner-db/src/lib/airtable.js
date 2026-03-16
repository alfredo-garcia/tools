/**
 * Minimal Airtable client for planner-db. Uses env: AIRTABLE_PAT, AIRTABLE_BASE_ID,
 * and optional AIRTABLE_BASE_ID_SHOPPING, AIRTABLE_BASE_ID_RECIPES.
 */
import Airtable from 'airtable'

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

export function getShoppingBase() {
  const pat = process.env.AIRTABLE_PAT
  const baseId = process.env.AIRTABLE_BASE_ID_SHOPPING || process.env.AIRTABLE_BASE_ID
  if (!pat || !baseId) return null
  return new Airtable({ apiKey: pat }).base(baseId)
}

export function getRecipesBase() {
  const pat = process.env.AIRTABLE_PAT
  const baseId = process.env.AIRTABLE_BASE_ID_RECIPES
  if (!pat || !baseId) return null
  return new Airtable({ apiKey: pat }).base(baseId)
}

export function fetchTable(tableName, maxRecords = 500, baseOverride = null) {
  const base = baseOverride || getBase()
  if (!base) return Promise.reject(new Error('Airtable not configured'))
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

export function fetchRecord(tableName, recordId, baseOverride = null) {
  const base = baseOverride || getBase()
  if (!base) return Promise.reject(new Error('Airtable not configured'))
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

export function updateRecord(tableName, recordId, fields, baseOverride = null) {
  const base = baseOverride || getBase()
  if (!base) return Promise.reject(new Error('Airtable not configured'))
  return base(tableName)
    .update(recordId, fields)
    .then((r) => recordToRow(r))
}

export function createRecord(tableName, fields, baseOverride = null) {
  const base = baseOverride || getBase()
  if (!base) return Promise.reject(new Error('Airtable not configured'))
  return base(tableName)
    .create(fields)
    .then((r) => recordToRow(r))
}

export function deleteRecord(tableName, recordId, baseOverride = null) {
  const base = baseOverride || getBase()
  if (!base) return Promise.reject(new Error('Airtable not configured'))
  return base(tableName).destroy(recordId)
}

export function checkConflict(tableName, recordId, clientLastModified, baseOverride = null) {
  if (!clientLastModified) return Promise.resolve({ conflict: false })
  return fetchRecord(tableName, recordId, baseOverride).then((current) => {
    const serverLM = current?.lastModified
    if (!serverLM) return { conflict: false }
    if (new Date(serverLM) > new Date(clientLastModified)) {
      return { conflict: true, serverLastModified: serverLM }
    }
    return { conflict: false }
  })
}
