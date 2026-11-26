import { expect, test } from '@playwright/test'

test('Marathi toggle translates core UI and persists', async ({ page }) => {
  await page.goto('/')
  await page.waitForTimeout(1200)
  const skip = page.getByText('Skip for now')
  if (await skip.count()) await skip.click()

  await page.getByRole('button', { name: /Toggle language/i }).click()
  await expect(page.getByRole('navigation', { name: 'Primary navigation' }).getByText('शोधा')).toBeVisible()
  await expect(page.getByRole('heading', { level: 1, name: /कॉलेज जाणीवपूर्वक निवडा/ })).toBeVisible()
  expect(await page.locator('html').getAttribute('lang')).toBe('mr')

  await page.reload()
  await page.waitForTimeout(1200)
  const skip2 = page.getByText('Skip for now')
  if (await skip2.count()) await skip2.click()
  await expect(page.getByRole('navigation', { name: 'Primary navigation' }).getByText('शोधा')).toBeVisible()

  await page.getByRole('button', { name: /Toggle language/i }).click()
  await expect(page.getByRole('navigation', { name: 'Primary navigation' }).getByText('Explore')).toBeVisible()
  expect(await page.locator('html').getAttribute('lang')).toBe('en')
})
