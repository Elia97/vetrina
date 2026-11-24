import { expect, type Page, test } from '@playwright/test'

import { stubBotIdChallenge } from './support'

const isDark = (page: Page) => page.evaluate(() => document.documentElement.classList.contains('dark'))

const storedTheme = (page: Page) => page.evaluate(() => localStorage.getItem('theme'))

const switchSystemTheme = async (page: Page, colorScheme: 'light' | 'dark') => {
  const listener = await page.evaluateHandle(() => ({
    changed: new Promise((resolve) =>
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', resolve, { once: true }),
    ),
  }))
  await page.emulateMedia({ colorScheme })
  await listener.evaluate(({ changed }) => changed)
}

const openHome = async ({ page }: { page: Page }) => {
  await stubBotIdChallenge(page)
  await page.goto('/')
}

test.describe('theme', () => {
  test.beforeEach(openHome)

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

test.describe('theme against the system preference', () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' })
    await openHome({ page })
  })

  test('stores the choice when the click goes against the system', async ({ page }) => {
    await page.locator('[data-theme-toggle]').first().click()

    expect(await isDark(page)).toBe(true)
    expect(await storedTheme(page)).toBe('dark')
  })

  test('forgets the choice when the click goes back to the system, which it then follows', async ({ page }) => {
    const toggle = page.locator('[data-theme-toggle]').first()

    await toggle.click()
    await toggle.click()

    expect(await isDark(page)).toBe(false)
    expect(await storedTheme(page)).toBeNull()

    await switchSystemTheme(page, 'dark')

    expect(await isDark(page)).toBe(true)
  })

  test('keeps a stored choice when the system changes, even once it matches', async ({ page }) => {
    await page.locator('[data-theme-toggle]').first().click()

    await switchSystemTheme(page, 'dark')
    await switchSystemTheme(page, 'light')

    expect(await isDark(page)).toBe(true)
    expect(await storedTheme(page)).toBe('dark')

    await page.reload()

    expect(await isDark(page)).toBe(true)
  })
})
