import { expect, test } from '@playwright/test'

import { ACTION_PATH, stubBotIdChallenge } from './support'

const INPUT_ERROR = {
  type: 'AstroActionInputError',
  issues: [
    { path: ['firstName'], message: 'first name is required' },
    { path: ['email'], message: 'a valid email is required' },
  ],
}

const FORM = 'form[data-contact-form]'
const SUBMIT = `${FORM} button[type="submit"]`

test.beforeEach(async ({ page }) => {
  await stubBotIdChallenge(page)
})

test('is served disabled and the binder enables it, so a submit needs the island', async ({ page }) => {
  await page.goto('/contatti')

  await expect(page.locator(SUBMIT)).toBeEnabled()
})

test('puts a rejected field in its own slot and focuses the first invalid one', async ({ page }) => {
  await page.route(ACTION_PATH, (route) =>
    route.fulfill({ status: 400, contentType: 'application/json', body: JSON.stringify(INPUT_ERROR) }),
  )
  await page.goto('/contatti')

  await page.locator(SUBMIT).click()

  await expect(page.locator('[data-field-error="firstName"]')).toHaveText('first name is required')
  await expect(page.locator('[data-field-error="email"]')).toHaveText('a valid email is required')
  await expect(page.locator('input[name="firstName"]')).toHaveAttribute('aria-invalid', 'true')
  await expect(page.locator('input[name="firstName"]')).toBeFocused()
})

// Un 204 è come il client di astro:actions legge un successo senza dati: deserializeActionResult()
// restituisce `{ data: undefined, error: undefined }` senza toccare il corpo.
test('reports success on a 204, without ever reaching Brevo', async ({ page }) => {
  const sent: string[] = []
  await page.route(ACTION_PATH, (route) => {
    sent.push(route.request().url())
    return route.fulfill({ status: 204 })
  })
  await page.goto('/contatti')

  const form = page.locator(FORM)
  await form.locator('input[name="firstName"]').fill('Ada')
  await form.locator('input[name="lastName"]').fill('Lovelace')
  await form.locator('input[name="email"]').fill('ada@example.test')
  await form.locator('textarea[name="message"]').fill('A message long enough to pass the schema.')
  await form.locator('input[name="consent"]').check()
  await form.locator('button[type="submit"]').click()

  await expect(page.locator('[data-form-success]')).toBeVisible()
  await expect(form.locator('input[name="email"]')).toHaveValue('')
  expect(sent).toHaveLength(1)
})

test('carries the BotID header, so the challenge is what gates the request', async ({ page }) => {
  await page.route(ACTION_PATH, (route) => route.fulfill({ status: 204 }))
  await page.goto('/contatti')

  const sent = page.waitForRequest((request) => request.url().includes('/_actions/contact'))
  await page.locator(SUBMIT).click()

  expect((await sent).headers()['x-is-human']).toContain('"b":1')
})
