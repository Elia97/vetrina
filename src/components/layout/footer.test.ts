import { afterEach, describe, expect, it, vi } from 'vitest'

import { COMPANY } from '@/lib/company'
import { SITE, type Site } from '@/lib/site'

import { it as dictionary } from '@/i18n/strings/it'

const CMP_ENV = { PUBLIC_GTM_ID: 'GTM-TEST', PUBLIC_IUBENDA_SITE_ID: '1234567' }
const PROFILE = { label: 'LinkedIn', href: 'https://www.linkedin.com/company/acme' }

// vi.resetModules() dà un registro nuovo: il container va importato da lì e non da quello
// esterno, altrimenti rende un componente compilato da un'altra istanza.
async function renderFooter(env: Record<string, string> = {}, pathname = '/') {
  vi.resetModules()
  for (const [key, value] of Object.entries(env)) vi.stubEnv(key, value)
  const [{ renderToFragment }, { default: Footer }] = await Promise.all([
    import('@test/container'),
    import('@/components/layout/footer.astro'),
  ])
  return renderToFragment(Footer, { request: new Request(`https://example.com${pathname}`) })
}

function mockSocial(social: Site['social']) {
  vi.doMock('@/lib/site', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@/lib/site')>()
    return { ...actual, SITE: { ...actual.SITE, social } }
  })
}

const cmpControl = (document: Awaited<ReturnType<typeof renderFooter>>) =>
  document.querySelector('.iubenda-cs-preferences-link')

afterEach(() => {
  vi.doUnmock('@/lib/site')
  vi.unstubAllEnvs()
  vi.resetModules()
})

describe('footer.astro', () => {
  it('lists every legal document declared in SITE', async () => {
    const document = await renderFooter()

    const hrefs = [...document.querySelectorAll('nav a')].map((link) => link.getAttribute('href'))
    for (const { href } of SITE.legal) expect(hrefs).toContain(href)
  })

  it('collega ogni profilo social che SITE dichiara', async () => {
    mockSocial([PROFILE])
    const document = await renderFooter()

    const hrefs = [...document.querySelectorAll('ul a')].map((link) => link.getAttribute('href'))
    expect(hrefs).toEqual([PROFILE.href])
  })

  it('senza profili social non rende la lista', async () => {
    mockSocial([])
    const document = await renderFooter()

    expect(document.querySelector('ul')).toBeNull()
  })

  it('marca come pagina corrente solo il documento legale aperto', async () => {
    const document = await renderFooter({}, '/privacy')

    const marked = [...document.querySelectorAll('nav a[aria-current]')].map((link) => [
      link.getAttribute('href'),
      link.getAttribute('aria-current'),
    ])
    expect(marked).toEqual([['/privacy', 'page']])
  })

  it('porta ragione sociale, sede e partita IVA da COMPANY', async () => {
    const text = ((await renderFooter()).body.textContent ?? '').replace(/\s+/g, ' ')
    const { streetAddress, postalCode, addressLocality, addressRegion } = COMPANY.address
    const address = `${streetAddress}, ${postalCode} ${addressLocality} (${addressRegion})`

    expect(text).toContain(`${COMPANY.legalName} · ${address} · ${dictionary['footer.vatNumber']} ${COMPANY.vatNumber}`)
  })
})

// [HARD] GDPR: unica revoca del consenso, perché src/lib/consent/iubenda.ts spegne floatingPreferencesButtonDisplay.
describe('il controllo delle preferenze cookie', () => {
  it('manca senza una CMP configurata, che è come il template arriva', async () => {
    expect(cmpControl(await renderFooter())).toBeNull()
  })

  it('compare con la CMP configurata, come pulsante che apre un dialog', async () => {
    const control = cmpControl(await renderFooter(CMP_ENV))

    expect(control?.tagName).toBe('BUTTON')
    expect(control?.getAttribute('type')).toBe('button')
    expect(control?.getAttribute('aria-haspopup')).toBe('dialog')
  })
})
