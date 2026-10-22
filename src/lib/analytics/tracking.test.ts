import { afterEach, describe, expect, it, vi } from 'vitest'

const GTM = 'GTM-TEST123'
const SITE_ID = '1234567'
const POLICY_ID = '7654321'
const ENGLISH_POLICY_ID = '7654322'

async function loadWith(env: Record<string, string>, locale?: string) {
  vi.resetModules()
  for (const [key, value] of Object.entries(env)) vi.stubEnv(key, value)
  return (await import('@/lib/analytics/tracking')).getTrackingConfig(locale)
}

afterEach(() => {
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
  vi.resetModules()
})

describe('getTrackingConfig — the off state', () => {
  it('is null when nothing is configured', async () => {
    expect(await loadWith({})).toBeNull()
  })

  it('is null with a GTM container but no CMP', async () => {
    expect(await loadWith({ PUBLIC_GTM_ID: GTM })).toBeNull()
  })

  // GTM senza banner è la combinazione illecita: cookie non essenziali senza nessun posto
  // in cui rifiutarli.
  it('is null with a CMP but no GTM container', async () => {
    expect(await loadWith({ PUBLIC_IUBENDA_SITE_ID: SITE_ID })).toBeNull()
  })
})

describe('getTrackingConfig — the on state', () => {
  it('returns both ids once they are set', async () => {
    expect(
      await loadWith({
        PUBLIC_GTM_ID: GTM,
        PUBLIC_IUBENDA_SITE_ID: SITE_ID,
        PUBLIC_IUBENDA_COOKIE_POLICY_ID: POLICY_ID,
      }),
    ).toEqual({ gtmId: GTM, iubendaSiteId: SITE_ID, cookiePolicyId: POLICY_ID })
  })

  it('tolerates a missing cookie policy id', async () => {
    const config = await loadWith({ PUBLIC_GTM_ID: GTM, PUBLIC_IUBENDA_SITE_ID: SITE_ID })
    expect(config?.cookiePolicyId).toBe('')
  })

  it("porta l'id di policy della lingua che riceve", async () => {
    const env = {
      PUBLIC_GTM_ID: GTM,
      PUBLIC_IUBENDA_SITE_ID: SITE_ID,
      PUBLIC_IUBENDA_COOKIE_POLICY_ID: POLICY_ID,
      PUBLIC_IUBENDA_COOKIE_POLICY_IDS: `en:${ENGLISH_POLICY_ID}`,
    }

    expect((await loadWith(env, 'en'))?.cookiePolicyId).toBe(ENGLISH_POLICY_ID)
    expect((await loadWith(env))?.cookiePolicyId).toBe(POLICY_ID)
  })
})

describe('getTrackingConfig — non-numeric ids are treated as unset', () => {
  it('refuses the [SENSITIVE] placeholder as a site id', async () => {
    expect(await loadWith({ PUBLIC_GTM_ID: GTM, PUBLIC_IUBENDA_SITE_ID: '[SENSITIVE]' })).toBeNull()
  })

  it('refuses the [SENSITIVE] placeholder as a policy id', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    const config = await loadWith({
      PUBLIC_GTM_ID: GTM,
      PUBLIC_IUBENDA_SITE_ID: SITE_ID,
      PUBLIC_IUBENDA_COOKIE_POLICY_ID: '[SENSITIVE]',
    })
    expect(config?.cookiePolicyId).toBe('')
    expect(error).toHaveBeenCalled()
  })

  it('refuses anything else non-numeric', async () => {
    for (const value of ['abc', '123abc', ' 123', '12.3']) {
      expect(await loadWith({ PUBLIC_GTM_ID: GTM, PUBLIC_IUBENDA_SITE_ID: value }), value).toBeNull()
    }
  })
})
