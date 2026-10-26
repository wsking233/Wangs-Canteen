import AxeBuilder from '@axe-core/playwright'
import { test, expect, seed, examplePantry } from './fixtures'
import { recordMeal } from '../../src/lib/pantry'

for (const theme of ['浅色', '深色'] as const) {
  test(`${theme} pages and meal dialogs satisfy automated accessibility checks`, async ({ page }) => {
    test.setTimeout(60_000)
    const data = examplePantry()
    const eaten = recordMeal(data, data.combinations[0], data.combinations[0].items, 'record', new Date().toISOString())
    await seed(page, eaten, 'data')
    await page.addStyleTag({ content: '*,*::before,*::after{animation:none!important;transition:none!important}' })
    await page.getByRole('button', { name: theme, exact: true }).click()
    for (const route of ['today', 'inventory', 'meals', 'history', 'data']) {
      await page.goto(`#${route}`)
      await expect(page.locator('main h1')).toBeVisible()
      const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()
      expect(result.violations.map(issue => ({ id: issue.id, help: issue.help, nodes: issue.nodes.map(node => node.target) })), `${theme} ${route}`).toEqual([])
    }
    await page.goto('#inventory')
    await page.getByRole('button', { name: '编辑炸鸡', exact: true }).click()
    const dialog = await new AxeBuilder({ page }).include('[role="dialog"]').withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()
    expect(dialog.violations.map(issue => ({ id: issue.id, nodes: issue.nodes.map(node => node.target) }))).toEqual([])
    await page.getByRole('button', { name: '取消', exact: true }).click()
    await page.goto('#today')
    await page.getByRole('button', { name: '就吃这个', exact: true }).click()
    const confirmation = await new AxeBuilder({ page }).include('[role="dialog"]').withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()
    expect(confirmation.violations.map(issue => ({ id: issue.id, nodes: issue.nodes.map(node => node.target) }))).toEqual([])
  })
}
