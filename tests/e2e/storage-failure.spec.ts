import { test, expect, seed, readPantry, examplePantry } from './fixtures'

test('a storage failure keeps the editor open and never reports a successful stock update', async ({ page }) => {
  await seed(page, undefined, 'inventory')
  await page.evaluate(() => { Storage.prototype.setItem = () => { throw new Error('存储空间不足') } })
  await page.getByRole('button', { name: '添加食物', exact: true }).click()
  await page.getByLabel('食物名称', { exact: true }).fill('无法保存的饺子')
  await page.getByLabel('剩余数量', { exact: true }).fill('2')
  await page.getByRole('button', { name: '保存食物', exact: true }).click()
  await expect(page.getByRole('dialog').getByText('存储空间不足', { exact: true })).toBeVisible()
  await expect(page.getByRole('dialog')).toBeVisible()
  expect(await readPantry(page)).toEqual(examplePantry())
  await page.getByRole('button', { name: '取消', exact: true }).click()
  await page.reload()
  await expect(page.getByLabel('食物：炸鸡', { exact: true })).toBeVisible()
  await expect(page.getByLabel('食物：无法保存的饺子', { exact: true })).toHaveCount(0)
})
