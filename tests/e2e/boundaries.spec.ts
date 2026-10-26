import { test, expect, seed, examplePantry } from './fixtures'
import { recordMeal } from '../../src/lib/pantry'

test('maximum-length food names, units and meal names fit 320px cards and dialogs', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 844 })
  const data = examplePantry()
  const foodName = 'A'.repeat(40)
  data.foods[0] = {
    ...data.foods[0],
    name: foodName,
    unit: 'PORTIONS',
    quantity: 1_000_000,
    note: 'B'.repeat(200),
  }
  data.foods[1] = {
    ...data.foods[1],
    name: '饺'.repeat(40),
    unit: '份'.repeat(8),
    quantity: 1_000_000,
  }
  data.combinations[0].name = 'C'.repeat(60)
  data.combinations[0].items[0].unit = data.foods[0].unit
  data.combinations[0].items[1].unit = data.foods[1].unit
  data.combinations[1].items[0].unit = data.foods[1].unit
  const eaten = recordMeal(
    data,
    data.combinations[0],
    data.combinations[0].items,
    'r',
    new Date().toISOString(),
  )
  eaten.foods = data.foods
  await seed(page, eaten, 'inventory')
  for (const route of ['inventory', 'meals', 'history', 'today/dinner']) {
    await page.goto(`#${route}`)
    await expect(page.locator('main h1')).toBeVisible()
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      route,
    ).toBe(true)
  }
  await page.getByRole('button', { name: '就吃这个', exact: true }).click()
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  expect(
    await dialog.evaluate((element) => element.scrollWidth <= element.clientWidth),
    'confirmation dialog horizontal overflow',
  ).toBe(true)
  await page.getByRole('button', { name: '先不吃', exact: true }).click()
  await page.goto('#meals')
  await page.getByRole('button', { name: `编辑搭配${'C'.repeat(60)}`, exact: true }).click()
  expect(
    await dialog.evaluate((element) => element.scrollWidth <= element.clientWidth),
    'combination form horizontal overflow',
  ).toBe(true)
  await page.getByRole('button', { name: '取消', exact: true }).click()
  await page.getByRole('button', { name: `删除搭配${'C'.repeat(60)}`, exact: true }).click()
  expect(
    await dialog.evaluate((element) => element.scrollWidth <= element.clientWidth),
    'delete title horizontal overflow',
  ).toBe(true)
  await page.getByRole('button', { name: '保留搭配', exact: true }).click()
  await page.goto('#history')
  await page.getByRole('button', { name: `修正记录：${'C'.repeat(60)}`, exact: true }).click()
  expect(
    await dialog.evaluate((element) => element.scrollWidth <= element.clientWidth),
    'record form horizontal overflow',
  ).toBe(true)
})
