import { expect, test } from '@playwright/test'

import { stubBotIdChallenge } from './support'

// Il pannello e il suo interruttore sono `md:hidden`: sopra i 768px non si aprono.
test.use({ viewport: { width: 390, height: 844 }, hasTouch: true })

test.describe('mobile nav', () => {
  test.beforeEach(async ({ page }) => {
    await stubBotIdChallenge(page)
    await page.goto('/')
  })

  test('opens from the button and moves focus inside the panel', async ({ page }) => {
    const toggle = page.locator('[data-mobile-nav-toggle]')
    const panel = page.locator('[data-mobile-nav]')

    await expect(toggle).toHaveAttribute('aria-expanded', 'false')
    await toggle.click()

    await expect(panel).toBeVisible()
    await expect(toggle).toHaveAttribute('aria-expanded', 'true')
    await expect(panel.locator(':focus')).toHaveCount(1)
  })

  test('closes on Escape and gives the focus back to the button', async ({ page }) => {
    const toggle = page.locator('[data-mobile-nav-toggle]')
    const panel = page.locator('[data-mobile-nav]')

    await toggle.click()
    await expect(panel).toBeVisible()

    await page.keyboard.press('Escape')

    await expect(panel).toBeHidden()
    await expect(toggle).toHaveAttribute('aria-expanded', 'false')
    await expect(toggle).toBeFocused()
  })

  test('makes the rest of the page inert, which aria-modal alone does not do', async ({ page }) => {
    const toggle = page.locator('[data-mobile-nav-toggle]')

    await toggle.click()

    const inertSiblings = await page.evaluate(() => {
      const panel = document.querySelector('[data-mobile-nav]')
      return Array.from(document.body.children)
        .filter((element) => element !== panel)
        .map((element) => (element as HTMLElement).inert)
    })

    expect(inertSiblings.every(Boolean)).toBe(true)
  })
})
