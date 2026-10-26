import { test, expect, seed, readPantry, examplePantry } from './fixtures'
import { recordMeal } from '../../src/lib/pantry'

test('correcting a meal adjusts only the difference and undo restores corrected portions', async ({ page }) => {
  const original = examplePantry()
  const eaten = recordMeal(original, original.combinations[0], original.combinations[0].items, 'r', new Date().toISOString())
  await seed(page, eaten, 'history')
  await page.getByRole('button', { name: '修正记录：炸鸡配意面', exact: true }).click()
  await page.getByLabel('这顿叫什么', { exact: true }).fill('晚饭实际用量')
  await page.getByLabel('炸鸡 · 实际用量（块）', { exact: true }).fill('3')
  await page.getByLabel('意面 · 实际用量（份）', { exact: true }).fill('0.5')
  await page.getByRole('button', { name: '保存记录修改', exact: true }).click()
  await expect(page.getByRole('dialog')).toBeHidden()
  const card = page.getByLabel('用餐：晚饭实际用量', { exact: true })
  await expect(card).toContainText('已修改')
  expect((await readPantry(page)).foods.map(food => food.quantity)).toEqual([5, 4.5])
  await page.reload()
  await page.getByRole('button', { name: '撤销这顿：晚饭实际用量', exact: true }).click()
  await page.getByRole('button', { name: '确认撤销并返还', exact: true }).click()
  await expect(card).toContainText('已撤销')
  expect((await readPantry(page)).foods.map(food => food.quantity)).toEqual([8, 5])
})
