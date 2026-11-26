import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

const paths = ['/', '/explore', '/predictor', '/college/:id', '/methodology', '/signin']

async function prepare(page: Page, path: string) {
  let target = path
  if (path === '/college/:id') {
    const response = await page.request.get('/api/colleges?page=1&pageSize=1')
    const body = await response.json()
    const id = body.data?.[0]?.id ?? 1
    target = `/college/${id}`
  }
  await page.goto(target)
  await page.waitForTimeout(1800)
  if (path === '/') {
    const skip = page.getByText('Skip for now')
    if (await skip.count()) await skip.click()
  }
}

for (const path of paths) {
  test(`accessibility: ${path}`, async ({ page }) => {
    await prepare(page, path)
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze()
    const serious = results.violations.filter((violation) => violation.impact === 'serious' || violation.impact === 'critical')
    expect(
      serious.map((violation) => ({
        id: violation.id,
        impact: violation.impact,
        nodes: violation.nodes.map((node) => node.target),
      })),
      `serious/critical accessibility violations on ${path}`
    ).toEqual([])
  })
}
