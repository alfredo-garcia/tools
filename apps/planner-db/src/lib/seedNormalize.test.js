import { describe, it } from 'node:test'
import assert from 'node:assert'
import { asDate, asNumber, asString, asTextArray, mapLinkArrayToUuids } from './seedNormalize.js'

describe('seedNormalize', () => {
  it('asDate extracts YYYY-MM-DD', () => {
    assert.strictEqual(asDate('2026-03-18'), '2026-03-18')
    assert.strictEqual(asDate('2026-03-18T12:00:00.000Z'), '2026-03-18')
    assert.strictEqual(asDate('bad'), null)
    assert.strictEqual(asDate(null), null)
  })

  it('asNumber parses numeric values', () => {
    assert.strictEqual(asNumber(3), 3)
    assert.strictEqual(asNumber('3.5'), 3.5)
    assert.strictEqual(asNumber(''), null)
    assert.strictEqual(asNumber('nope'), null)
  })

  it('asString trims and normalizes empty', () => {
    assert.strictEqual(asString('  hi  '), 'hi')
    assert.strictEqual(asString('   '), null)
    assert.strictEqual(asString(null), null)
  })

  it('asTextArray normalizes scalar/array', () => {
    assert.deepStrictEqual(asTextArray([' a ', '', 'b']), ['a', 'b'])
    assert.deepStrictEqual(asTextArray('  x '), ['x'])
    assert.deepStrictEqual(asTextArray(''), [])
  })

  it('mapLinkArrayToUuids maps rec ids to uuids', () => {
    const out = mapLinkArrayToUuids(['recA', 'recB'])
    assert.strictEqual(out.length, 2)
    assert.ok(/^[0-9a-f-]{36}$/.test(out[0]))
    assert.notStrictEqual(out[0], out[1])
  })
})

