import test from 'node:test'
import assert from 'node:assert/strict'
import {
  availability,
  parsePantry,
  savePantry,
  validateCombination,
  PANTRY_KEY,
  type Combination,
  type Pantry,
} from '../src/lib/pantry.ts'
const foods = [
  { id: 'chicken', name: '炸鸡', unit: '块', quantity: 8, enabled: true, note: '' },
  { id: 'pasta', name: '意面', unit: '份', quantity: 5, enabled: true, note: '' },
]
const meal: Combination = {
  id: 'dinner',
  name: '炸鸡配意面',
  items: [
    { foodId: 'chicken', quantity: 2, unit: '块' },
    { foodId: 'pasta', quantity: 0.5, unit: '份' },
  ],
}
const pantry: Pantry = { version: 3, foods, combinations: [meal], records: [] }

test('upgrades v1 inventory in memory without changing food IDs or amounts', () => {
  const result = parsePantry(JSON.stringify({ version: 1, foods }))
  assert.equal(result.version, 3)
  assert.deepEqual(result.foods, foods)
  assert.deepEqual(result.combinations, [])
  assert.deepEqual(parsePantry(null), { version: 3, foods: [], combinations: [], records: [] })
})
test('round-trips combinations and reports stock availability precisely', () => {
  assert.deepEqual(parsePantry(JSON.stringify(pantry)), pantry)
  assert.deepEqual(availability(meal, foods), [])
  assert.deepEqual(availability(meal, [{ ...foods[0], quantity: 1 }, foods[1]]), ['炸鸡还差 1 块'])
  assert.deepEqual(availability(meal, [{ ...foods[0], enabled: false }, foods[1]]), ['炸鸡已停用'])
  assert.match(availability(meal, [foods[1]])[0], /已被删除/)
  assert.match(availability(meal, [{ ...foods[0], unit: '份' }, foods[1]])[0], /单位已修改/)
})
test('rejects malformed and duplicate ingredients, zero quantities and unsupported data versions', () => {
  for (const change of [
    { items: [] },
    { items: [meal.items[0], meal.items[0]] },
    { name: ' ' },
    { items: [{ ...meal.items[0], quantity: 0 }] },
    { items: [{ ...meal.items[0], quantity: -1 }] },
  ])
    assert.throws(() => validateCombination({ ...meal, ...change }))
  for (const raw of [
    JSON.stringify({ ...pantry, version: 99 }),
    JSON.stringify({ ...pantry, combinations: [meal, meal] }),
    JSON.stringify({ ...pantry, foods: [foods[0], foods[0]] }),
  ])
    assert.throws(() => parsePantry(raw))
})
test('saves the full snapshot, refuses stale writes, and preserves old data on storage failure', () => {
  let raw: string | null = JSON.stringify({ version: 1, foods })
  const storage = {
    getItem: (key: string) => {
      assert.equal(key, PANTRY_KEY)
      return raw
    },
    setItem: (_key: string, next: string) => {
      raw = next
    },
  }
  const previous = raw
  savePantry(storage, previous, pantry)
  assert.deepEqual(parsePantry(raw), pantry)
  assert.throws(() => savePantry(storage, previous, { ...pantry, foods: [] }), /其他页面/)
  const saved = raw
  assert.throws(
    () =>
      savePantry(
        {
          ...storage,
          setItem: () => {
            throw new Error('quota')
          },
        },
        raw,
        { ...pantry, combinations: [] },
      ),
    /quota/,
  )
  assert.equal(raw, saved)
})

test('v2 combinations upgrade without dropping food or item quantities', () => {
  const result = parsePantry(JSON.stringify({ version: 2, foods, combinations: [meal] }))
  assert.equal(result.version, 3)
  assert.deepEqual(result.combinations, [meal])
  assert.deepEqual(result.records, [])
})

test('the sole write API rejects legacy or incomplete snapshots before touching storage', () => {
  let writes = 0
  const storage = {
    getItem: () => null,
    setItem: () => {
      writes++
    },
  }
  assert.throws(
    () => savePantry(storage, null, { version: 1, foods } as unknown as Pantry),
    /旧版本/,
  )
  assert.throws(() => savePantry(storage, null, { version: 3, foods } as unknown as Pantry))
  assert.throws(() =>
    savePantry(storage, null, { ...pantry, foods: [{ ...foods[0], quantity: -1 }] }),
  )
  assert.equal(writes, 0)
})
