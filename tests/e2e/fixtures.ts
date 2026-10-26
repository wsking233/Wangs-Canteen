import { test as base, expect, type Page } from '@playwright/test'
import { PANTRY_KEY, type Pantry } from '../../src/lib/pantry.ts'

export { expect, PANTRY_KEY }
export const test = base.extend<{ runtimeErrors: string[] }>({
  runtimeErrors: [async ({ page }, use) => {
    const errors: string[] = []
    page.on('pageerror', error => errors.push(error.message))
    await use(errors)
    expect(errors, '浏览器不应出现未处理的运行错误').toEqual([])
  }, { auto: true }],
})

export function examplePantry(): Pantry {
  return {
    version: 3,
    foods: [
      { id: 'chicken', name: '炸鸡', quantity: 8, unit: '块', enabled: true, note: '' },
      { id: 'pasta', name: '意面', quantity: 5, unit: '份', enabled: true, note: '' },
    ],
    combinations: [
      { id: 'dinner', name: '炸鸡配意面', items: [{ foodId: 'chicken', quantity: 2, unit: '块' }, { foodId: 'pasta', quantity: 1, unit: '份' }] },
      { id: 'small', name: '小份意面', items: [{ foodId: 'pasta', quantity: 0.5, unit: '份' }] },
    ],
    records: [],
  }
}

export async function seed(page: Page, data: unknown = examplePantry(), route = 'today') {
  await page.goto('')
  await page.evaluate(({ key, data }) => localStorage.setItem(key, JSON.stringify(data)), { key: PANTRY_KEY, data })
  await page.goto(`#${route}`)
  await page.reload()
}
export async function readPantry(page: Page): Promise<Pantry> {
  return page.evaluate(key => JSON.parse(localStorage.getItem(key)!), PANTRY_KEY)
}
