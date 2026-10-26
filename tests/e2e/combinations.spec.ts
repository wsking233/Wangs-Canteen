import { test, expect, examplePantry, seed, readPantry } from './fixtures'

test('legacy inventory migrates to multi-food combinations without consuming stock', async ({
  page,
}) => {
  await seed(page, { version: 1, foods: examplePantry().foods }, 'meals')
  await page.getByRole('button', { name: '新建搭配', exact: true }).click()
  await page.getByLabel('搭配名称', { exact: true }).fill('炸鸡配意面')
  await page.getByRole('button', { name: /^炸鸡/ }).click()
  await page.getByLabel('炸鸡每餐用量', { exact: true }).fill('2')
  await page.getByRole('button', { name: /^意面/ }).click()
  await page.getByLabel('意面每餐用量', { exact: true }).fill('0.5')
  await page.getByRole('button', { name: '保存搭配', exact: true }).click()
  await expect(page.getByRole('dialog')).toBeHidden()
  const card = page.getByLabel('搭配：炸鸡配意面', { exact: true })
  await expect(card).toContainText('库存足够')
  await page.reload()
  await expect(card).toContainText('0.5 份')
  expect((await readPantry(page)).foods.map((food) => food.quantity)).toEqual([8, 5])
  await page.getByRole('button', { name: '删除搭配炸鸡配意面', exact: true }).click()
  await page.getByRole('button', { name: '确认删除搭配', exact: true }).click()
  await expect(card).toHaveCount(0)
  expect((await readPantry(page)).foods.map((food) => food.quantity)).toEqual([8, 5])
})
