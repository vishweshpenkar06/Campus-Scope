import { expect, test } from '@playwright/test'

test('admin data dashboard is gated', async ({ page }) => {
  const response = await page.goto('/admin/data')
  expect(response?.ok()).toBeTruthy()
  await expect(page.getByRole('heading', { name: /Data operations/i })).toBeVisible()
  await expect(page.getByText(/ADMIN_EMAILS/i)).toBeVisible()
})
