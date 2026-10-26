import test from 'node:test'
import assert from 'node:assert/strict'
import {
  cancelMeal,
  recordMeal,
  chooseMeal,
  type Pantry,
  type Combination,
} from '../src/lib/pantry.ts'
const foods = [
  { id: 'a', name: '炸鸡', unit: '块', quantity: 8, enabled: true, note: '' },
  { id: 'b', name: '意面', unit: '份', quantity: 5, enabled: true, note: '' },
]
const meal: Combination = {
  id: 'm',
  name: '晚饭',
  items: [
    { foodId: 'a', quantity: 2, unit: '块' },
    { foodId: 'b', quantity: 0.5, unit: '份' },
  ],
}
const pantry: Pantry = { version: 3, foods, combinations: [meal], records: [] }
const now = '2026-10-26T14:00:00.000Z'
const later = '2026-10-26T14:01:00.000Z'
test('undo restores exact quantities once and marks history instead of deleting it', () => {
  const eaten = recordMeal(pantry, meal, meal.items, 'r', now)
  const undone = cancelMeal(eaten, 'r', later)
  assert.deepEqual(undone.foods, foods)
  assert.equal(undone.records[0].cancelledAt, later)
  assert.equal(eaten.records[0].cancelledAt, undefined)
  assert.throws(() => cancelMeal(undone, 'r', later), /已撤销/)
  assert.throws(() => cancelMeal(undone, 'missing', later), /不存在/)
})
test('undo adds to current stock and reconstructs deleted food from the snapshot', () => {
  const eaten = recordMeal(pantry, meal, meal.items, 'r', now)
  const changed = { ...eaten, foods: [{ ...eaten.foods[0], quantity: 10, name: '改名炸鸡' }] }
  const undone = cancelMeal(changed, 'r', later)
  assert.equal(undone.foods[0].quantity, 12)
  assert.equal(undone.foods[0].name, '改名炸鸡')
  assert.equal(undone.foods[1].quantity, 0.5)
  assert.equal(undone.foods[1].id, 'b')
})
test('changed units or overflowing stock reject the entire undo without partial stock writes', () => {
  const eaten = recordMeal(pantry, meal, meal.items, 'r', now)
  for (const food of [
    { ...eaten.foods[1], unit: '包' },
    { ...eaten.foods[1], quantity: 1_000_000 },
  ]) {
    const changed = { ...eaten, foods: [eaten.foods[0], food] }
    assert.throws(() => cancelMeal(changed, 'r', later))
    assert.equal(changed.foods[0].quantity, 6)
    assert.equal(changed.records[0].cancelledAt, undefined)
  }
})
test('cancelled meals do not penalize recommendation weights', () => {
  const other = { ...meal, id: 'other', items: [meal.items[1]] }
  const eaten = recordMeal({ ...pantry, combinations: [meal, other] }, meal, meal.items, 'r', now)
  const undone = cancelMeal(eaten, 'r', later)
  assert.equal(chooseMeal(undone, undefined, () => 0.3)?.id, 'm')
})
