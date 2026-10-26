import { readFile } from 'node:fs/promises'
import { test, expect, seed, PANTRY_KEY, examplePantry, readPantry } from './fixtures'

test('backup preview protects data and can recover a corrupt snapshot', async ({ page }) => {
  await seed(page, undefined, 'data')
  const downloadEvent = page.waitForEvent('download')
  await page.getByRole('button', { name: '导出备份', exact: true }).click()
  const backup = await downloadEvent
  const content = await readFile((await backup.path())!, 'utf8')
  expect(JSON.parse(content).format).toBe('wangs-canteen-backup')
  await page.evaluate((key) => localStorage.setItem(key, 'corrupt'), PANTRY_KEY)
  await page.reload()
  await expect(
    page.getByRole('button', { name: '导出原始数据用于恢复', exact: true }),
  ).toBeVisible()
  const file = page.getByLabel('选择备份文件', { exact: true })
  await file.setInputFiles({
    name: 'bad.json',
    mimeType: 'application/json',
    buffer: Buffer.from('bad JSON'),
  })
  await expect(
    page.getByText('文件不是有效的 JSON，请重新选择原始备份文件。', { exact: true }),
  ).toBeVisible()
  expect(await page.evaluate((key) => localStorage.getItem(key), PANTRY_KEY)).toBe('corrupt')
  await file.setInputFiles({
    name: 'backup.json',
    mimeType: 'application/json',
    buffer: Buffer.from(content),
  })
  await expect(page.getByRole('button', { name: '确认导入并替换', exact: true })).toBeDisabled()
  await page.getByRole('checkbox').check()
  await page.getByRole('button', { name: '确认导入并替换', exact: true }).click()
  await expect(page.getByText('备份已恢复，可以继续使用小食堂。', { exact: true })).toBeVisible()
  expect(await readPantry(page)).toEqual(examplePantry())
  await page.reload()
  expect(await readPantry(page)).toEqual(examplePantry())
})
