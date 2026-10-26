import { test, expect, PANTRY_KEY } from './fixtures'

test('without Web Locks, a duplicate immediate submission is single-flight and persists once', async ({
  page,
}) => {
  await page.addInitScript(() => Object.defineProperty(navigator, 'locks', { value: undefined }))
  await page.goto('#inventory')
  await page.getByRole('button', { name: '添加食物', exact: true }).click()
  await page.getByLabel('食物名称', { exact: true }).fill('米线')
  await page.getByLabel('剩余数量', { exact: true }).fill('1.5')
  await page
    .getByRole('dialog')
    .locator('form')
    .evaluate((form) => {
      if (!(form instanceof HTMLFormElement)) throw new Error('Expected a form element')
      form.requestSubmit()
      form.requestSubmit()
    })
  await expect(page.getByRole('dialog')).toBeHidden()
  const foods = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key)!).foods,
    PANTRY_KEY,
  )
  expect(foods).toHaveLength(1)
  expect(foods[0].quantity).toBe(1.5)
})
