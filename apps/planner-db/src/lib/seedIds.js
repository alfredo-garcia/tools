import { v5 as uuidv5 } from 'uuid'

// Fixed UUID namespace for Airtable → Postgres deterministic IDs.
// Do NOT change once seeds are in use; it would remap all IDs.
export const AIRTABLE_UUID_NAMESPACE = '7bca1e62-2e2a-4f41-9e34-41ad1e5d09a1'

/**
 * Deterministic UUID from an Airtable record id (e.g. "rec...").
 * @param {string} airtableRecordId
 */
export function uuidFromAirtableId(airtableRecordId) {
  if (typeof airtableRecordId !== 'string' || !airtableRecordId.trim()) {
    throw new Error('airtableRecordId must be a non-empty string')
  }
  return uuidv5(airtableRecordId.trim(), AIRTABLE_UUID_NAMESPACE)
}

