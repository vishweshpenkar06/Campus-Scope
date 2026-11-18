import { expect, test } from '@playwright/test'

test('JEE predictor returns all-India results', async ({ page }) => {
  await page.goto('/predictor')
  await page.getByLabel('Entrance Exam').selectOption('JEE')
  await page.getByLabel('Your Percentile').fill('95')
  await page.getByRole('button', { name: /Find my colleges/i }).click()

  await expect(page.getByText('Your Readout')).toBeVisible()
  await expect(page.getByText(/Based on JEE OPEN category cutoffs/i)).toBeVisible()
  await expect(page.getByText(/Safe|Target|Reach/).first()).toBeVisible()
})
