import test from 'node:test'
import assert from 'node:assert/strict'
import { createBackup, parseBackup, MAX_BACKUP_BYTES } from '../src/lib/backup.ts'
import type { Pantry } from '../src/lib/pantry.ts'
const pantry: Pantry = {
  version: 3,
  foods: [{ id: 'a', name: '饺子', quantity: 0.5, unit: '份', enabled: true, note: '冷冻' }],
  combinations: [],
  records: [],
}
const now = '2026-10-26T14:00:00.000Z'
test('round-trips the complete pantry through an identifiable backup envelope', () => {
  const text = createBackup(pantry, now)
  const envelope = JSON.parse(text)
  assert.equal(envelope.format, 'wangs-canteen-backup')
  assert.equal(envelope.exportedAt, now)
  assert.deepEqual(parseBackup(text), pantry)
})
test('imports old inventory and pantry snapshots without replaying stock deductions', () => {
  assert.deepEqual(parseBackup(JSON.stringify({ version: 1, foods: pantry.foods })), pantry)
  assert.deepEqual(
    parseBackup(JSON.stringify({ version: 2, foods: pantry.foods, combinations: [] })),
    pantry,
  )
  assert.deepEqual(parseBackup(JSON.stringify(pantry)), pantry)
})
test('rejects unsupported format/version, corrupt schema, duplicate IDs, oversized or non-JSON input', () => {
  for (const value of [
    'hello',
    'null',
    '[]',
    JSON.stringify({ format: 'another-app', backupVersion: 1, data: pantry }),
    JSON.stringify({ ...pantry, foods: [pantry.foods[0], pantry.foods[0]] }),
    JSON.stringify({ ...pantry, foods: [{ ...pantry.foods[0], quantity: -1 }] }),
  ])
    assert.throws(() => parseBackup(value))
  assert.throws(() => parseBackup(' '.repeat(MAX_BACKUP_BYTES + 1)), /20 MB/)
  assert.throws(
    () =>
      parseBackup(
        JSON.stringify({
          ...pantry,
          foods: Array(10001)
            .fill(null)
            .map((_, i) => ({ ...pantry.foods[0], id: String(i) })),
        }),
      ),
    /数量/,
  )
})
