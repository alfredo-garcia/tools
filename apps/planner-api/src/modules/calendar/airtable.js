import Airtable from 'airtable'

export function getSettingsBase() {
  const pat = process.env.AIRTABLE_PAT
  const baseId = process.env.AIRTABLE_BASE_ID_SETTINGS || process.env.AIRTABLE_BASE_ID
  if (!pat || !baseId) return null
  return new Airtable({ apiKey: pat }).base(baseId)
}

export function createRecord(tableName, fields, baseOverride = null) {
  const base = baseOverride || getSettingsBase()
  if (!base) return Promise.reject(new Error('Airtable no configurado'))
  return base(tableName).create(fields)
}

export function updateRecord(tableName, recordId, fields, baseOverride = null) {
  const base = baseOverride || getSettingsBase()
  if (!base) return Promise.reject(new Error('Airtable no configurado'))
  return base(tableName).update(recordId, fields)
}

export function deleteRecord(tableName, recordId, baseOverride = null) {
  const base = baseOverride || getSettingsBase()
  if (!base) return Promise.reject(new Error('Airtable no configurado'))
  return base(tableName).destroy(recordId)
}

