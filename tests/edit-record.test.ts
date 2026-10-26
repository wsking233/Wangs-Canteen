import test from 'node:test'
import assert from 'node:assert/strict'
import {
  recordMeal,
  editMeal,
  cancelMeal,
  type Pantry,
  type Combination,
} from '../src/lib/pantry.ts'
import { fromLocalInput, toLocalInput } from '../src/lib/dates.ts'
const pantry: Pantry = {
  version: 3,
  foods: [
    { id: 'a', name: '炸鸡', quantity: 8, unit: '块', enabled: true, note: '' },
    { id: 'b', name: '意面', quantity: 5, unit: '份', enabled: true, note: '' },
  ],
  combinations: [],
  records: [],
}
const meal: Combination = {
  id: 'm',
  name: '晚饭',
  items: [
    { foodId: 'a', quantity: 2, unit: '块' },
    { foodId: 'b', quantity: 1, unit: '份' },
  ],
}
const now = '2026-10-26T14:00:12.345Z',
  later = '2026-10-26T14:01:00.000Z'
const eaten = recordMeal(pantry, meal, meal.items, 'r', now)
test('editing only applies the consumption delta and is idempotent for unchanged absolute portions', () => {
  const change = {
    name: '实际晚饭',
    eatenAt: now,
    items: [
      { ...meal.items[0], quantity: 3 },
      { ...meal.items[1], quantity: 0.5 },
    ],
  }
  const result = editMeal(eaten, 'r', change, later)
  assert.deepEqual(
    result.foods.map((food) => food.quantity),
    [5, 4.5],
  )
  assert.equal(result.records.length, 1)
  assert.equal(result.records[0].name, '实际晚饭')
  assert.equal(result.records[0].editedAt, later)
  assert.deepEqual(editMeal(result, 'r', change, later).foods, result.foods)
  assert.deepEqual(cancelMeal(result, 'r', later).foods, pantry.foods)
})
test('removing an ingredient refunds its full old use, and empty or foreign ingredients are rejected', () => {
  const result = editMeal(
    eaten,
    'r',
    { name: '只吃炸鸡', eatenAt: now, items: [meal.items[0]] },
    later,
  )
  assert.deepEqual(
    result.foods.map((food) => food.quantity),
    [6, 5],
  )
  assert.throws(() => editMeal(eaten, 'r', { name: 'none', eatenAt: now, items: [] }, later))
  assert.throws(() =>
    editMeal(
      eaten,
      'r',
      { name: 'foreign', eatenAt: now, items: [{ foodId: 'other', quantity: 1, unit: '份' }] },
      later,
    ),
  )
  assert.throws(
    () =>
      editMeal(
        cancelMeal(eaten, 'r', later),
        'r',
        { name: 'cancelled', eatenAt: now, items: meal.items },
        later,
      ),
    /已撤销/,
  )
})
test('unit changes, insufficient amounts and invalid dates reject the whole edit', () => {
  const changed = { ...eaten, foods: [eaten.foods[0], { ...eaten.foods[1], unit: '包' }] }
  assert.throws(
    () =>
      editMeal(
        changed,
        'r',
        {
          name: 'bad',
          eatenAt: now,
          items: [
            { ...meal.items[0], quantity: 1 },
            { ...meal.items[1], quantity: 2 },
          ],
        },
        later,
      ),
    /单位/,
  )
  assert.equal(changed.foods[0].quantity, 6)
  assert.throws(
    () =>
      editMeal(
        eaten,
        'r',
        { name: 'bad', eatenAt: now, items: [{ ...meal.items[0], quantity: 99 }] },
        later,
      ),
    /不足/,
  )
  assert.throws(() =>
    editMeal(eaten, 'r', { name: 'bad', eatenAt: 'not-a-date', items: meal.items }, later),
  )
})
test('unchanged quantities permit metadata edits at stock capacity or after unit changes', () => {
  const changed = {
    ...eaten,
    foods: [
      { ...eaten.foods[0], quantity: 1_000_000 },
      { ...eaten.foods[1], unit: '包' },
    ],
  }
  const result = editMeal(changed, 'r', { name: '新名称', eatenAt: now, items: meal.items }, later)
  assert.deepEqual(result.foods, changed.foods)
})
test('reducing use of a deleted item reconstructs only the refunded difference', () => {
  const result = editMeal(
    { ...eaten, foods: [eaten.foods[0]] },
    'r',
    { name: 'half', eatenAt: now, items: [meal.items[0], { ...meal.items[1], quantity: 0.25 }] },
    later,
  )
  assert.equal(result.foods.find((food) => food.id === 'b')?.quantity, 0.75)
  assert.throws(() =>
    editMeal(
      { ...eaten, foods: [eaten.foods[0]] },
      'r',
      { name: 'more', eatenAt: now, items: [meal.items[0], { ...meal.items[1], quantity: 2 }] },
      later,
    ),
  )
})
test('unchanged local minute preserves original seconds; invalid local times reject', () => {
  assert.equal(fromLocalInput(toLocalInput(now), now), now)
  assert.throws(() => fromLocalInput('not-a-date'))
  assert.throws(() => fromLocalInput('2026-02-30T12:00'))
})
