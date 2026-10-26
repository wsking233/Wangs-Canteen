import { test, expect, seed } from './fixtures'

test('phone navigation stays reachable and route changes expose the current page title and focus', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await seed(page)
  const nav = page.getByRole('navigation', { name: '主导航', exact: true })
  await page.getByRole('link', { name: '我的库存', exact: true }).click()
  await expect(page).toHaveTitle('我的库存 · 小王食堂')
  await expect(page.locator('main h1')).toBeFocused()
  await expect(page.getByRole('link', { name: '我的库存', exact: true })).toHaveAttribute(
    'aria-current',
    'page',
  )
  await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight))
  await expect(nav).toBeInViewport()
  const footer = await page.locator('footer').boundingBox()
  const bar = await nav.boundingBox()
  expect(footer!.y + footer!.height).toBeLessThanOrEqual(bar!.y)
  await page.getByRole('link', { name: '用餐记录', exact: true }).click()
  await expect(page).toHaveTitle('用餐记录 · 小王食堂')
  await expect(page.locator('main h1')).toBeFocused()
  await page.goBack()
  await expect(page).toHaveTitle('我的库存 · 小王食堂')
  await page.goto('#invalid-route')
  await expect(page).toHaveTitle('今天吃什么 · 小王食堂')
})

test('keyboard focus stays in the food editor and returns to its trigger', async ({ page }) => {
  await page.goto('#inventory')
  const trigger = page.getByRole('button', { name: '添加食物', exact: true })
  await trigger.click()
  await expect(page.getByLabel('食物名称', { exact: true })).toBeFocused()
  for (let i = 0; i < 14; i++) {
    await page.keyboard.press('Tab')
    expect(
      await page.evaluate(() => Boolean(document.activeElement?.closest('[role="dialog"]'))),
    ).toBe(true)
  }
  for (let i = 0; i < 4; i++) {
    await page.keyboard.press('Shift+Tab')
    expect(
      await page.evaluate(() => Boolean(document.activeElement?.closest('[role="dialog"]'))),
    ).toBe(true)
  }
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toBeHidden()
  await expect(trigger).toBeFocused()
})
