import { afterEach, describe, expect, it, vi } from 'vitest'

import { DEFAULT_LOCALE } from '@/lib/site'

const DEFAULT_ID = '11111111'
const ENGLISH_ID = '22222222'
const GERMAN_ID = '33333333'

async function loadWith(env: Record<string, string>) {
  vi.resetModules()
  vi.unstubAllEnvs()
  for (const [key, value] of Object.entries(env)) vi.stubEnv(key, value)
  return (await import('@/lib/legal/policy-id')).iubendaPolicyId
}

afterEach(() => {
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
  vi.resetModules()
})

describe('iubendaPolicyId — la lingua di default', () => {
  it('legge PUBLIC_IUBENDA_COOKIE_POLICY_ID, anche quando la lingua non è indicata', async () => {
    const iubendaPolicyId = await loadWith({ PUBLIC_IUBENDA_COOKIE_POLICY_ID: DEFAULT_ID })

    expect(iubendaPolicyId(DEFAULT_LOCALE)).toBe(DEFAULT_ID)
    expect(iubendaPolicyId()).toBe(DEFAULT_ID)
  })

  it('non si lascia scavalcare da una coppia per la lingua di default', async () => {
    const iubendaPolicyId = await loadWith({
      PUBLIC_IUBENDA_COOKIE_POLICY_ID: DEFAULT_ID,
      PUBLIC_IUBENDA_COOKIE_POLICY_IDS: `${DEFAULT_LOCALE}:${ENGLISH_ID}`,
    })

    expect(iubendaPolicyId(DEFAULT_LOCALE)).toBe(DEFAULT_ID)
  })
})

describe('iubendaPolicyId — le altre lingue', () => {
  it('legge la coppia della lingua in PUBLIC_IUBENDA_COOKIE_POLICY_IDS, spazi compresi', async () => {
    const iubendaPolicyId = await loadWith({
      PUBLIC_IUBENDA_COOKIE_POLICY_ID: DEFAULT_ID,
      PUBLIC_IUBENDA_COOKIE_POLICY_IDS: `fr, en:${ENGLISH_ID}, de : ${GERMAN_ID}`,
    })

    expect(iubendaPolicyId('en')).toBe(ENGLISH_ID)
    expect(iubendaPolicyId('de')).toBe(GERMAN_ID)
    expect(iubendaPolicyId('fr')).toBe('')
  })

  it('è vuoto per una lingua senza la sua coppia, o senza la sua variabile', async () => {
    const onlyPairs = await loadWith({
      PUBLIC_IUBENDA_COOKIE_POLICY_ID: '',
      PUBLIC_IUBENDA_COOKIE_POLICY_IDS: `en:${ENGLISH_ID}`,
    })
    expect(onlyPairs('de')).toBe('')
    expect(onlyPairs(DEFAULT_LOCALE)).toBe('')

    const onlyDefault = await loadWith({ PUBLIC_IUBENDA_COOKIE_POLICY_ID: DEFAULT_ID })
    expect(onlyDefault('en')).toBe('')
  })
})

describe('iubendaPolicyId — gli id non numerici valgono come non configurati', () => {
  it('per la lingua di default, e lo dice', async () => {
    const iubendaPolicyId = await loadWith({ PUBLIC_IUBENDA_COOKIE_POLICY_ID: '[SENSITIVE]' })
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(iubendaPolicyId(DEFAULT_LOCALE)).toBe('')
    expect(error).toHaveBeenCalled()
  })

  it("per un'altra lingua, e lo dice", async () => {
    const iubendaPolicyId = await loadWith({ PUBLIC_IUBENDA_COOKIE_POLICY_IDS: 'en:[SENSITIVE]' })
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(iubendaPolicyId('en')).toBe('')
    expect(error).toHaveBeenCalled()
  })
})
