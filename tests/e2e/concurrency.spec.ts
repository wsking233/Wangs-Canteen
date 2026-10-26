import { test, expect, seed, readPantry } from './fixtures'

declare global {
  interface Window {
    __testLockHeld: boolean
    __testReleaseLock: () => void
    __testLockTask: Promise<unknown>
  }
}

test('simultaneous tabs create one meal and perform only one refund', async ({ page, context }) => {
  await seed(page, undefined, 'today/dinner')
  const other = await context.newPage()
  const holder = await context.newPage()
  await other.goto('#today/dinner')
  await holder.goto('')
  async function hold() {
    await holder.evaluate(() => {
      window.__testLockHeld = false
      window.__testLockTask = navigator.locks.request('wangs-canteen.inventory.v1.write', async () => {
        window.__testLockHeld = true
        await new Promise<void>(resolve => { window.__testReleaseLock = resolve })
      })
    })
    await holder.waitForFunction(() => window.__testLockHeld)
  }
  async function release() {
    await holder.evaluate(() => window.__testReleaseLock())
    await holder.evaluate(() => window.__testLockTask)
  }
  for (const tab of [page, other]) await tab.getByRole('button', { name: '就吃这个', exact: true }).click()
  await hold()
  for (const tab of [page, other]) await tab.getByRole('button', { name: '确认开饭', exact: true }).click()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toBeVisible()
  await release()
  await expect.poll(async () => (await readPantry(page)).records.length).toBe(1)
  expect((await readPantry(page)).foods.map(food => food.quantity)).toEqual([6, 4])
  for (const tab of [page, other]) {
    await tab.goto('#history')
    await tab.reload()
    await tab.getByRole('button', { name: '撤销用餐炸鸡配意面', exact: true }).click()
  }
  await hold()
  for (const tab of [page, other]) await tab.getByRole('button', { name: '确认撤销并返还', exact: true }).click()
  await release()
  await expect.poll(async () => Boolean((await readPantry(page)).records[0].cancelledAt)).toBe(true)
  expect((await readPantry(page)).foods.map(food => food.quantity)).toEqual([8, 5])
  await other.close()
  await holder.close()
})
