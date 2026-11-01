import { expect, test } from '@playwright/test'

test('search -> college profile -> predictor -> auth-gated shortlist', async ({ page }) => {
  await page.goto('/explore?q=COEP')
  const collegeLink = page.getByRole('link', { name: /COEP/i }).first()
  await expect(collegeLink).toBeVisible()
  await collegeLink.click()

  await expect(page.getByRole('heading', { level: 1, name: /COEP/i })).toBeVisible()
  await page.getByRole('button', { name: /Save to shortlist/i }).click()
  await expect(page.getByText(/Sign in first/i)).toBeVisible()

  await page.goto('/predictor')
  await page.getByLabel('Your Percentile').fill('92')
  await page.getByRole('button', { name: /Find my colleges/i }).click()
  await expect(page.getByText('Your Readout')).toBeVisible()
  await expect(page.getByText(/Safe|Target|Reach/).first()).toBeVisible()
})
