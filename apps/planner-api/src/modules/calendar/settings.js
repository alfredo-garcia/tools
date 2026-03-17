/**
 * Key-Value access to Airtable "Settings" table (columns Key, Value).
 * Used for calendar connection tokens (CAL_1_*, CAL_2_*, CAL_3_*).
 */
import { getSettingsBase, createRecord, updateRecord, deleteRecord } from './airtable.js'

const SETTINGS_TABLE = 'Settings'
const KEY_FIELD = 'Key'
const VALUE_FIELD = 'Value'

function escapeFormulaString(s) {
  return String(s).replace(/'/g, "''")
}

export async function getSettingsByPrefix(prefix) {
  const base = getSettingsBase()
  const out = new Map()
  if (!base || !prefix) return out
  return new Promise((resolve, reject) => {
    const formula = `FIND("${String(prefix).replace(/"/g, '""')}", {${KEY_FIELD}}) = 1`
    base(SETTINGS_TABLE)
      .select({ filterByFormula: formula, pageSize: 100 })
      .firstPage((err, records) => {
        if (err) return reject(err)
        for (const r of records || []) {
          const k = r.fields && r.fields[KEY_FIELD]
          const v = r.fields && r.fields[VALUE_FIELD]
          if (k != null) out.set(String(k), v != null ? String(v) : '')
        }
        resolve(out)
      })
  })
}

export async function getSetting(key) {
  const base = getSettingsBase()
  if (!base) return null
  return new Promise((resolve, reject) => {
    const formula = `{${KEY_FIELD}}='${escapeFormulaString(key)}'`
    base(SETTINGS_TABLE)
      .select({ maxRecords: 1, filterByFormula: formula })
      .firstPage((err, records) => {
        if (err) return reject(err)
        const r = records && records[0]
        const value = r && r.fields && r.fields[VALUE_FIELD]
        resolve(value != null ? String(value) : null)
      })
  })
}

export async function setSetting(key, value) {
  const base = getSettingsBase()
  if (!base) return Promise.reject(new Error('Airtable Settings no configurado'))
  const formula = `{${KEY_FIELD}}='${escapeFormulaString(key)}'`
  return new Promise((resolve, reject) => {
    base(SETTINGS_TABLE)
      .select({ maxRecords: 1, filterByFormula: formula })
      .firstPage(async (err, records) => {
        if (err) return reject(err)
        const strValue = value != null ? String(value) : ''
        try {
          if (records && records[0]) {
            await updateRecord(SETTINGS_TABLE, records[0].id, { [VALUE_FIELD]: strValue }, getSettingsBase())
          } else {
            await createRecord(SETTINGS_TABLE, { [KEY_FIELD]: key, [VALUE_FIELD]: strValue }, getSettingsBase())
          }
          resolve()
        } catch (e) {
          reject(e)
        }
      })
  })
}

export async function deleteSetting(key) {
  const base = getSettingsBase()
  if (!base) return Promise.reject(new Error('Airtable Settings no configurado'))
  const formula = `{${KEY_FIELD}}='${escapeFormulaString(key)}'`
  return new Promise((resolve, reject) => {
    base(SETTINGS_TABLE)
      .select({ maxRecords: 1, filterByFormula: formula })
      .firstPage(async (err, records) => {
        if (err) return reject(err)
        if (!records || !records[0]) {
          resolve()
          return
        }
        try {
          await deleteRecord(SETTINGS_TABLE, records[0].id, getSettingsBase())
          resolve()
        } catch (e) {
          reject(e)
        }
      })
  })
}

