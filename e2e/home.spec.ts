import { expect, test } from '@playwright/test'

import { collectProblems, stubBotIdChallenge, watchCspViolations } from './support'

test.describe('home', () => {
  test('loads with no console error and no CSP violation', async ({ page }) => {
    const problems = collectProblems(page)
    await watchCspViolations(page, problems)
    await stubBotIdChallenge(page)

    await page.goto('/')
    await expect(page.locator('header')).toBeVisible()

    expect(problems).toEqual([])
  })

  test('carries the built CSP in a meta tag, which is what makes those violations visible', async ({ page }) => {
    await page.goto('/')

    const policy = await page.locator('meta[http-equiv="Content-Security-Policy"]').getAttribute('content')

    expect(policy).toContain("script-src 'self'")
  })

  test('renders the expected markup: skip link, nav, footer', async ({ page }) => {
    await page.goto('/')

    await expect(page.locator('a[href="#main-content"]')).toHaveCount(1)
    await expect(page.getByRole('navigation').first()).toBeVisible()
    await expect(page.locator('footer')).toBeVisible()
  })
})
