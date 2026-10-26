import { test, expect, seed, readPantry, examplePantry } from './fixtures'

test('malformed identifiers and missing backup data never replace the current pantry', async ({
  page,
}) => {
  await seed(page, undefined, 'data')
  const original = await readPantry(page)
  const bad = examplePantry()
  bad.combinations[0].id = String.fromCharCode(0xd800)
  const picker = page.waitForEvent('filechooser')
  await page.getByRole('button', { name: '选择备份文件', exact: true }).click()
  await (
    await picker
  ).setFiles({
    name: 'bad-identifiers.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(bad)),
  })
  await expect(
    page.getByText('搭配标识包含无效字符或超过 128 字符。', { exact: true }),
  ).toBeVisible()
  await expect(page.getByLabel('备份导入预览', { exact: true })).toHaveCount(0)
  expect(await readPantry(page)).toEqual(original)
  await page.getByLabel('选择备份文件', { exact: true }).setInputFiles({
    name: 'missing-data.json',
    mimeType: 'application/json',
    buffer: Buffer.from(
      JSON.stringify({
        format: 'wangs-canteen-backup',
        backupVersion: 1,
        exportedAt: new Date().toISOString(),
      }),
    ),
  })
  await expect(
    page.getByText('备份缺少完整数据，请选择本应用导出的原始文件。', { exact: true }),
  ).toBeVisible()
  expect(await readPantry(page)).toEqual(original)
  await page.getByRole('link', { name: '常用搭配', exact: true }).click()
  await expect(page.getByLabel('搭配：炸鸡配意面', { exact: true })).toBeVisible()
})
