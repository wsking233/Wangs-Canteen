import { test, expect, seed, examplePantry } from './fixtures'

test('theme preference survives reload and responds to system changes', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' })
  await page.goto('#data')
  await expect(page.locator('html')).toHaveClass(/dark/)
  await page.getByRole('button', { name: '浅色', exact: true }).click()
  await page.reload()
  await expect(page.locator('html')).not.toHaveClass(/dark/)
  await page.getByRole('button', { name: '跟随系统', exact: true }).click()
  await expect(page.locator('html')).toHaveClass(/dark/)
  await page.emulateMedia({ colorScheme: 'light' })
  await expect(page.locator('html')).not.toHaveClass(/dark/)
})

test('low stock shortcut excludes disabled food and clears after restocking', async ({ page }) => {
  const data = examplePantry()
  data.foods[0].lowStockAt = 8
  data.foods[1].enabled = false
  data.foods[1].lowStockAt = 10
  await seed(page, data)
  await page.getByRole('link', { name: '看看该补什么', exact: true }).click()
  await expect(page.getByLabel('食物：炸鸡', { exact: true })).toBeVisible()
  await expect(page.getByLabel('食物：意面', { exact: true })).toHaveCount(0)
  await page.getByLabel('食物：炸鸡', { exact: true }).getByRole('button', { name: '补货', exact: true }).click()
  await page.getByLabel('补货数量（块）', { exact: true }).fill('1')
  await page.getByRole('button', { name: '确认补货', exact: true }).click()
  await expect(page.getByRole('dialog')).toBeHidden()
  await expect(page.getByLabel('食物：炸鸡', { exact: true })).toHaveCount(0)
})
