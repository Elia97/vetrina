import { afterEach, describe, expect, it, vi } from 'vitest'

import { SITE } from '@/lib/site'

const CMP_ENV = { PUBLIC_GTM_ID: 'GTM-TEST', PUBLIC_IUBENDA_SITE_ID: '1234567' }

// vi.resetModules() dà un registro nuovo: il container va importato da lì e non da quello
// esterno, altrimenti rende un componente compilato da un'altra istanza.
async function renderFooter(env: Record<string, string> = {}) {
  vi.resetModules()
  for (const [key, value] of Object.entries(env)) vi.stubEnv(key, value)
  const [{ renderToFragment }, { default: Footer }] = await Promise.all([
    import('@test/container'),
    import('@/components/layout/footer.astro'),
  ])
  return renderToFragment(Footer)
}

const cmpLink = (document: Awaited<ReturnType<typeof renderFooter>>) =>
  document.querySelector('.iubenda-cs-preferences-link')

afterEach(() => {
  vi.unstubAllEnvs()
  vi.resetModules()
})

describe('footer.astro', () => {
  it('lists every legal document declared in SITE', async () => {
    const document = await renderFooter()

    const hrefs = [...document.querySelectorAll('nav a')].map((link) => link.getAttribute('href'))
    for (const { href } of SITE.legal) expect(hrefs).toContain(href)
  })

  it('links each social profile SITE declares', async () => {
    const document = await renderFooter()

    const hrefs = [...document.querySelectorAll('ul a')].map((link) => link.getAttribute('href'))
    expect(hrefs).toEqual(SITE.social.map(({ href }) => href))
  })
})

// [HARD] GDPR: il link deve seguire la CMP in entrambe le direzioni (src/lib/consent/iubenda.ts).
describe('the cookie-preferences link', () => {
  it('is absent when no CMP is configured, which is how the template ships', async () => {
    expect(cmpLink(await renderFooter())).toBeNull()
  })

  it('appears once the CMP is configured', async () => {
    expect(cmpLink(await renderFooter(CMP_ENV))).not.toBeNull()
  })
})
