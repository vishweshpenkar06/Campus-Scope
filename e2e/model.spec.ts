import { expect, test } from '@playwright/test'

test('model card explains deterministic chances', async ({ page }) => {
  await page.goto('/model')
  await expect(page.getByRole('heading', { level: 1, name: /How the chance number works/i })).toBeVisible()
  await expect(page.getByText(/logistic-1\.1\.0/)).toBeVisible()
  await expect(page.getByText(/not an admission/i).first()).toBeVisible()

  const sitemap = await page.request.get('/sitemap.xml')
  expect(await sitemap.text()).toContain('/model')
})
