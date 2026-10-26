import test from 'node:test'
import assert from 'node:assert/strict'
import { addStock, INVENTORY_KEY, isAvailable, parseInventory, saveInventory, validQuantity, type Food } from '../src/lib/inventory.ts'

const chicken: Food = { id: 'chicken', name: '炸鸡', unit: '块', quantity: 8, enabled: true, note: '' }

test('accepts fractional stock and rejects negative, non-finite, excessive or over-precision amounts', () => {
  for (const value of [0, 0.5, 0.01, 1_000_000]) assert.equal(validQuantity(value), true)
  for (const value of [-1, NaN, Infinity, 1_000_001, 0.001, 1e-10, 1.000000001]) assert.equal(validQuantity(value), false)
})

test('restocking uses exact hundredths and leaves the original food unchanged', () => {
  assert.equal(addStock({ ...chicken, quantity: 0.1 }, 0.2).quantity, 0.3)
  assert.equal(chicken.quantity, 8)
  for (const amount of [0, -1, NaN, 0.001, 1_000_000]) assert.throws(() => addStock(chicken, amount))
})

test('empty or disabled food cannot be used in meal combinations', () => {
  assert.equal(isAvailable(chicken), true)
  assert.equal(isAvailable({ ...chicken, quantity: 0 }), false)
  assert.equal(isAvailable({ ...chicken, enabled: false }), false)
})

test('round-trips a versioned inventory, including fractional units and notes', () => {
  const foods = [chicken, { ...chicken, id: 'pasta', name: '意面', quantity: 0.5, unit: '份', note: '半份' }]
  assert.deepEqual(parseInventory(JSON.stringify({ version: 1, foods })).foods, foods)
  assert.deepEqual(parseInventory(null).foods, [])
})

test('rejects corrupt, unsupported, invalid, or duplicate records', () => {
  for (const raw of ['bad JSON', 'null', '{}', JSON.stringify({ version: 2, foods: [] }), JSON.stringify({ version: 1, foods: [chicken, chicken] }), JSON.stringify({ version: 1, foods: [{ ...chicken, quantity: -1 }] }), JSON.stringify({ version: 1, foods: [{ ...chicken, name: ' ' }] })]) assert.throws(() => parseInventory(raw))
})

test('writes atomically and refuses a stale tab overwriting newer inventory', () => {
  const data = new Map<string, string>()
  const storage = { getItem: (key: string) => data.get(key) ?? null, setItem: (key: string, value: string) => { data.set(key, value) } }
  const raw = saveInventory(storage, null, [chicken])
  assert.equal(data.get(INVENTORY_KEY), raw)
  assert.throws(() => saveInventory(storage, null, []), /其他页面/)
  assert.equal(data.get(INVENTORY_KEY), raw)
  assert.equal(parseInventory(saveInventory(storage, raw, [{ ...chicken, quantity: 0.5 }])).foods[0]?.quantity, 0.5)
})

test('storage failure is surfaced and invalid data is never written', () => {
  let writes = 0
  const storage = { getItem: () => null, setItem: () => { writes++; throw new Error('QuotaExceededError') } }
  assert.throws(() => saveInventory(storage, null, [chicken]), /QuotaExceededError/)
  assert.equal(writes, 1)
  assert.throws(() => saveInventory(storage, null, [{ ...chicken, quantity: -1 }]))
  assert.equal(writes, 1)
})
