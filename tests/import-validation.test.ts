import test from 'node:test'
import assert from 'node:assert/strict'
import { parseBackup, BACKUP_FORMAT } from '../src/lib/backup.ts'
import { validQuantity } from '../src/lib/inventory.ts'
import { validIdentifier, isTimestamp } from '../src/lib/validation.ts'
import type { Pantry } from '../src/lib/pantry.ts'
const now = '2026-10-26T14:00:00.000Z'
const pantry: Pantry = {
  version: 3,
  foods: [{ id: 'a', name: '饺子', unit: '份', quantity: 1, enabled: true, note: '' }],
  combinations: [
    { id: 'meal/one', name: '晚饭', items: [{ foodId: 'a', unit: '份', quantity: 1 }] },
  ],
  records: [],
}

test('malformed or oversized identifiers are rejected before route encoding or form rendering', () => {
  for (const id of ['\ud800', 'a b', 'a\u0000b', 'a\nb', 'a'.repeat(129)]) {
    assert.throws(() =>
      parseBackup(JSON.stringify({ ...pantry, combinations: [{ ...pantry.combinations[0], id }] })),
    )
    assert.throws(() =>
      parseBackup(JSON.stringify({ ...pantry, foods: [{ ...pantry.foods[0], id }] })),
    )
  }
})
test('invalid numeric objects return false instead of throwing during coercion', () => {
  assert.equal(validQuantity({ toString: null } as unknown as number), false)
  assert.equal(validQuantity('1' as unknown as number), false)
})
test('UTF-8 BOM and leading whitespace are accepted for a valid backup', () => {
  assert.deepEqual(parseBackup('\ufeff  ' + JSON.stringify(pantry)), pantry)
})
test('non-ISO and impossible record times are rejected', () => {
  for (const eatenAt of ['2026', '2026-02-30T14:00:00.000Z', '2026-10-26 14:00'])
    assert.throws(() =>
      parseBackup(
        JSON.stringify({
          ...pantry,
          records: [
            {
              id: 'r',
              name: '晚饭',
              combinationId: 'meal/one',
              eatenAt,
              items: [{ foodId: 'a', name: '饺子', unit: '份', quantity: 1 }],
            },
          ],
        }),
      ),
    )
})
test('an incomplete backup envelope has an actionable error instead of a JSON engine error', () => {
  assert.throws(
    () => parseBackup(JSON.stringify({ format: BACKUP_FORMAT, backupVersion: 1, exportedAt: now })),
    /缺少完整数据/,
  )
})

test('normal, encoded-route and Unicode identifiers remain valid', () => {
  for (const id of ['a', 'meal/one', '食物🍜', '__proto__']) assert.equal(validIdentifier(id), true)
  assert.equal(validIdentifier(null), false)
  assert.equal(validIdentifier(123), false)
  assert.equal(isTimestamp(now), true)
  assert.equal(isTimestamp('2026-02-30T14:00:00.000Z'), false)
  assert.equal(isTimestamp('x'.repeat(100000)), false)
})

test('UTF-16 checks reject either unpaired surrogate but allow valid pairs', () => {
  assert.equal(validIdentifier(String.fromCharCode(0xd800)), false)
  assert.equal(validIdentifier(String.fromCharCode(0xdc00)), false)
  assert.equal(validIdentifier(String.fromCharCode(0xd800, 0xd800)), false)
  assert.equal(validIdentifier(String.fromCharCode(0xd83c, 0xdf5c)), true)
})
