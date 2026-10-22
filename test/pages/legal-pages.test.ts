import { twoLocaleManifest } from '@test/helpers/second-locale'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import { useTranslations } from '@/i18n/translate'

const POLICY_ID = '11111111'
const ENGLISH_POLICY_ID = '22222222'

vi.mock('astro:config/client', () => import('@test/helpers/second-locale').then((m) => m.twoLocaleConfig))

const pages = {
  privacy: () => import('@/pages/privacy.astro'),
  'cookie-policy': () => import('@/pages/cookie-policy.astro'),
}
type LegalPage = keyof typeof pages

async function renderEnglish(page: LegalPage, env: Record<string, string>) {
  vi.resetModules()
  for (const [key, value] of Object.entries(env)) vi.stubEnv(key, value)
  const [{ renderToFragment }, { default: Page }] = await Promise.all([import('@test/container'), pages[page]()])
  return renderToFragment(Page, { request: new Request(`https://example.com/en/${page}`) }, twoLocaleManifest)
}

function mockIubenda() {
  return vi.spyOn(globalThis, 'fetch').mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => ({ success: true, content: '<p>Policy</p>' }),
  } as Response)
}

// La prima compilazione delle due pagine costa circa 7 secondi, sopra i 5 del timeout di un test.
beforeAll(() => Promise.all([import('@test/container'), ...Object.values(pages).map((load) => load())]), 30_000)

afterEach(() => {
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
  vi.resetModules()
})

describe.each(Object.keys(pages) as LegalPage[])('/en/%s con due lingue configurate', (page) => {
  it('chiede a iubenda la policy inglese', async () => {
    const fetchSpy = mockIubenda()
    await renderEnglish(page, {
      PUBLIC_IUBENDA_COOKIE_POLICY_ID: POLICY_ID,
      PUBLIC_IUBENDA_COOKIE_POLICY_IDS: `en:${ENGLISH_POLICY_ID}`,
    })

    expect(fetchSpy.mock.calls.map(([url]) => String(url))).toEqual([
      expect.stringContaining(`/privacy-policy/${ENGLISH_POLICY_ID}/`),
    ])
  })

  it('senza la coppia inglese non chiede niente, e dice che il documento non è disponibile', async () => {
    const fetchSpy = mockIubenda()
    const document = await renderEnglish(page, { PUBLIC_IUBENDA_COOKIE_POLICY_ID: POLICY_ID })

    expect(fetchSpy).not.toHaveBeenCalled()
    expect(document.body.textContent).toContain(useTranslations('en')('legal.unavailable'))
  })
})
