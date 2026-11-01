import { expect, test } from '@playwright/test'

test('option form generates, reorders, and exports a list', async ({ page }) => {
  await page.goto('/option-form')
  await page.getByLabel('Your Percentile').fill('92')
  await page.getByRole('button', { name: 'Computer Engineering' }).click()
  await page.getByRole('button', { name: /Generate preference list/i }).click()

  await expect(page.getByText(/No preferences yet/)).toBeHidden()
  const rows = page.locator('ol > li')
  await expect(rows.first()).toBeVisible()

  const download = page.waitForEvent('download')
  await page.getByRole('button', { name: 'CSV' }).click()
  expect((await download).suggestedFilename()).toBe('campusscope-option-form.csv')
})
