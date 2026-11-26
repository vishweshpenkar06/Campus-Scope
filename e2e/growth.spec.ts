import { expect, test } from '@playwright/test'

test('alert opt-in and referral link work', async ({ page }) => {
  await page.goto('/alerts')
  await page.getByLabel('Email address').fill('student@example.com')
  await page.getByLabel(/I agree to receive/i).check()
  await page.getByRole('button', { name: /Enable alerts/i }).click()
  await expect(page.getByText(/You will get updates by email/i)).toBeVisible()

  await page.goto('/predictor')
  await expect(page.getByRole('heading', { name: /Bring a friend/i })).toBeVisible()
  await expect(page.getByRole('button', { name: /Copy invite link/i })).toBeEnabled()
})

test('anonymous shortlist persists on this device', async ({ page }) => {
  const response = await page.request.get('/api/colleges?page=1&pageSize=1')
  const body = await response.json()
  const college = body.data[0]
  await page.goto(`/college/${college.id}`)
  await page.getByRole('button', { name: /Save to shortlist/i }).click()
  await expect(page.getByText(/Saved on this device/i)).toBeVisible()
  await page.goto('/shortlist')
  await expect(page.getByText(/Saved on this device/i)).toBeVisible()
  await expect(page.getByRole('link', { name: college.name })).toBeVisible()
})
