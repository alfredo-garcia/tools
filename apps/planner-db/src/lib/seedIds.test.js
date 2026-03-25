import { describe, it } from 'node:test'
import assert from 'node:assert'
import { uuidFromAirtableId } from './seedIds.js'

describe('uuidFromAirtableId', () => {
  it('is deterministic for the same record id', () => {
    const a = uuidFromAirtableId('rec123')
    const b = uuidFromAirtableId('rec123')
    assert.strictEqual(a, b)
  })

  it('trims whitespace', () => {
    const a = uuidFromAirtableId('rec123')
    const b = uuidFromAirtableId(' rec123 ')
    assert.strictEqual(a, b)
  })

  it('throws on invalid input', () => {
    assert.throws(() => uuidFromAirtableId(''), /non-empty/i)
    assert.throws(() => uuidFromAirtableId(null), /non-empty/i)
  })
})

