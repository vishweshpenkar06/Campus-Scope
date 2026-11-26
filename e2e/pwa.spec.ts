import { expect, test } from '@playwright/test'

test('PWA manifest and service worker are available', async ({ page }) => {
  const response = await page.request.get('/manifest.webmanifest')
  expect(response.ok()).toBeTruthy()
  const manifest = await response.json()
  expect(manifest.name).toContain('CampusScope')
  expect(manifest.display).toBe('standalone')
  expect(manifest.icons.length).toBeGreaterThan(0)

  const sw = await page.request.get('/sw.js')
  expect(sw.ok()).toBeTruthy()
  expect(await sw.text()).toContain('campusscope-v1')

  await page.goto('/')
  await page.waitForFunction(async () => {
    if (!('serviceWorker' in navigator)) return false
    const registration = await navigator.serviceWorker.getRegistration()
    return Boolean(registration || navigator.serviceWorker.controller)
  }, undefined, { timeout: 5000 })
})
