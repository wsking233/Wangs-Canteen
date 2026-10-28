import { test, expect, seed, readPantry, examplePantry } from './fixtures'

test('a one-time meal is recorded from one form without creating a saved combination', async ({
  page,
}) => {
  const data = examplePantry()
  data.combinations = []
  await seed(page, data)
  await page.getByRole('button', { name: '自己搭一顿', exact: true }).click()
  await expect(page.getByLabel('从库存添加', { exact: true })).toBeFocused()
  await page.getByRole('button', { name: /^炸鸡/ }).click()
  await page.getByLabel('炸鸡每餐用量', { exact: true }).fill('2')
  await page.getByRole('button', { name: /^意面/ }).click()
  await page.getByLabel('意面每餐用量', { exact: true }).fill('0.25')
  expect((await readPantry(page)).records).toHaveLength(0)
  await page.getByRole('button', { name: '确认开饭', exact: true }).click()
  await expect(page.getByRole('dialog')).toBeHidden()
  const saved = await readPantry(page)
  expect(saved.combinations).toHaveLength(0)
  expect(saved.foods.map((food) => food.quantity)).toEqual([6, 4.75])
  expect(saved.records).toHaveLength(1)
  expect(saved.records[0].combinationId).toBe('')
  await page.getByRole('link', { name: '用餐记录', exact: true }).click()
  await expect(page.getByText('自由搭配', { exact: true })).toBeVisible()
})

test('fractional stock is ready to eat by default and cancelling leaves data unchanged', async ({
  page,
}) => {
  const data = examplePantry()
  data.foods[1].quantity = 0.25
  data.combinations = []
  await seed(page, data)
  await page.getByRole('button', { name: '自己搭一顿', exact: true }).click()
  await page.getByRole('button', { name: /^意面/ }).click()
  await expect(page.getByLabel('意面每餐用量', { exact: true })).toHaveValue('0.25')
  await expect(page.getByRole('button', { name: '确认开饭', exact: true })).toBeEnabled()
  await page.getByRole('button', { name: '取消', exact: true }).click()
  expect(await readPantry(page)).toEqual(data)
  await expect(page.getByRole('button', { name: '自己搭一顿', exact: true })).toBeFocused()
  await page.getByRole('button', { name: '自己搭一顿', exact: true }).click()
  await page.getByRole('button', { name: /^意面/ }).click()
  await page.getByRole('button', { name: '确认开饭', exact: true }).click()
  await expect(page.getByRole('dialog')).toBeHidden()
  expect((await readPantry(page)).foods[1].quantity).toBe(0)
})

test('unavailable stock points to inventory instead of a disabled meal action', async ({
  page,
}) => {
  const data = examplePantry()
  data.foods.forEach((food) => {
    food.quantity = 0
  })
  await seed(page, data)
  await expect(page.getByRole('button', { name: '自己搭一顿', exact: true })).toHaveCount(0)
  await page.getByRole('link', { name: '去库存补货', exact: true }).click()
  await expect(page).toHaveURL(/#inventory$/)
})

test('a failed one-time meal keeps the selections and can retry without duplicate deductions', async ({
  page,
}) => {
  const data = examplePantry()
  data.combinations = []
  await seed(page, data)
  await page.getByRole('button', { name: '自己搭一顿', exact: true }).click()
  await page.getByRole('button', { name: /^意面/ }).click()
  await page.getByLabel('意面每餐用量', { exact: true }).fill('0.25')
  await page.evaluate(() => {
    const original = Storage.prototype.setItem
    Storage.prototype.setItem = function (key, value) {
      Storage.prototype.setItem = original
      throw new Error(`存储空间不足，未保存 ${key.length + value.length} 字符`)
    }
  })
  await page.getByRole('button', { name: '确认开饭', exact: true }).click()
  await expect(page.getByRole('dialog').getByRole('alert')).toContainText('存储空间不足')
  expect(await readPantry(page)).toEqual(data)
  await expect(page.getByLabel('意面每餐用量', { exact: true })).toHaveValue('0.25')
  await page.getByRole('button', { name: '确认开饭', exact: true }).click()
  await expect(page.getByRole('dialog')).toBeHidden()
  const saved = await readPantry(page)
  expect(saved.records).toHaveLength(1)
  expect(saved.foods[1].quantity).toBe(4.75)
})
