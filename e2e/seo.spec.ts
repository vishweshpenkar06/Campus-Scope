import { expect, test } from '@playwright/test'

test('guides render with FAQ structured data and appear in the sitemap', async ({ page }) => {
  await page.goto('/guides/how-cap-rounds-work')
  await expect(page.getByRole('heading', { level: 1, name: /How Maharashtra CAP rounds/i })).toBeVisible()

  const schema = await page.locator('script[type="application/ld+json"]').textContent()
  expect(schema).toContain('FAQPage')
  expect(schema).toContain('Article')

  const sitemap = await page.request.get('/sitemap.xml')
  expect(sitemap.ok()).toBeTruthy()
  const xml = await sitemap.text()
  expect(xml).toContain('/guides/how-cap-rounds-work')
  expect(xml).toContain('/guides/how-to-fill-option-form')
  expect(xml.match(/<loc>/g)?.length ?? 0).toBeGreaterThan(50)
})
