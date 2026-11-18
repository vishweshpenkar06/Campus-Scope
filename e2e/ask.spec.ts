import { expect, test } from '@playwright/test'

test('ask returns an answer with citations', async ({ page }) => {
  await page.goto('/predictor')
  await page.getByLabel(/Ask the admissions desk/i).fill('85 percentile CS Pune')
  await page.getByRole('button', { name: 'Ask', exact: true }).click()

  await expect(page.getByText(/found .*Safe|closest recorded option|no .* cutoff row/i)).toBeVisible()
  await expect(page.getByText(/Citations/i)).toBeVisible()
  await expect(page.getByText(/Directional guidance/i)).toBeVisible()
})
