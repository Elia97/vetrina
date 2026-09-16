import { expect, test } from '@playwright/test'

import { stubBotIdChallenge } from './support'

const isDark = (page: import('@playwright/test').Page) =>
  page.evaluate(() => document.documentElement.classList.contains('dark'))

test.describe('theme', () => {
  test.beforeEach(async ({ page }) => {
    await stubBotIdChallenge(page)
    await page.goto('/')
  })

  test('survives a reload, because the toggle writes to localStorage', async ({ page }) => {
    const before = await isDark(page)

    await page.locator('[data-theme-toggle]').first().click()
    const toggled = await isDark(page)
    expect(toggled).toBe(!before)

    await page.reload()

    expect(await isDark(page)).toBe(toggled)
  })

  test('survives a view transition, where the document element is swapped', async ({ page }) => {
    await page.locator('[data-theme-toggle]').first().click()
    const toggled = await isDark(page)

    await page
      .getByRole('link', { name: /contatti/i })
      .first()
      .click()
    await page.waitForURL('**/contatti')

    expect(await isDark(page)).toBe(toggled)
  })

  test('keeps aria-pressed in step with the class it reports', async ({ page }) => {
    const toggle = page.locator('[data-theme-toggle]').first()

    await toggle.click()

    await expect(toggle).toHaveAttribute('aria-pressed', String(await isDark(page)))
  })
})
