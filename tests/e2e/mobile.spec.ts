import { test, expect, seed } from './fixtures'

test('all app views fit phone, tablet and desktop widths', async ({ page }) => {
  await seed(page)
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 960 })
    for (const route of ['today', 'inventory', 'meals', 'history', 'data']) {
      await page.goto(`#${route}`)
      await expect(page.locator('main h1')).toBeVisible()
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
        `${route} at ${width}px`,
      ).toBe(true)
    }
  }
})
