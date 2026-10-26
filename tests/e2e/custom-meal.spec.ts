import { test, expect, seed, readPantry, examplePantry } from './fixtures'

test('a one-time meal requires confirmation and never creates a saved combination', async ({
  page,
}) => {
  const data = examplePantry()
  data.combinations = []
  await seed(page, data)
  await page.getByRole('button', { name: '自己搭一顿', exact: true }).click()
  await page.getByRole('button', { name: /^炸鸡/ }).click()
  await page.getByLabel('炸鸡每餐用量', { exact: true }).fill('2')
  await page.getByRole('button', { name: /^意面/ }).click()
  await page.getByLabel('意面每餐用量', { exact: true }).fill('0.5')
  await page.getByRole('button', { name: '确认本次搭配', exact: true }).click()
  await expect(page.getByRole('heading', { name: '开饭前，确认一下', exact: true })).toBeVisible()
  expect((await readPantry(page)).records).toHaveLength(0)
  await page.getByLabel('意面 · 本次用量（份）', { exact: true }).fill('0.25')
  await page.getByRole('button', { name: '调整搭配', exact: true }).click()
  await expect(page.getByLabel('意面每餐用量', { exact: true })).toHaveValue('0.25')
  await page.getByRole('button', { name: '确认本次搭配', exact: true }).click()
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
