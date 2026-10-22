import { twoLocaleManifest } from '@test/helpers/second-locale'
import { afterEach, describe, expect, it, vi } from 'vitest'

const POLICY_ID = '11111111'
const ENGLISH_POLICY_ID = '22222222'

vi.mock('astro:config/client', () => import('@test/helpers/second-locale').then((m) => m.twoLocaleConfig))

async function bannerPolicyId(pathname: string) {
  vi.resetModules()
  vi.stubEnv('PUBLIC_GTM_ID', 'GTM-TEST123')
  vi.stubEnv('PUBLIC_IUBENDA_SITE_ID', '1234567')
  vi.stubEnv('PUBLIC_IUBENDA_COOKIE_POLICY_ID', POLICY_ID)
  vi.stubEnv('PUBLIC_IUBENDA_COOKIE_POLICY_IDS', `en:${ENGLISH_POLICY_ID}`)
  const [{ renderToString }, { default: Tracking }] = await Promise.all([
    import('@test/container'),
    import('./tracking.astro'),
  ])
  const html = await renderToString(
    Tracking,
    { request: new Request(`https://example.com${pathname}`) },
    twoLocaleManifest,
  )
  return /"cookiePolicyId":"(\d*)"/.exec(html)?.[1]
}

afterEach(() => {
  vi.unstubAllEnvs()
  vi.resetModules()
})

describe('tracking.astro con due lingue configurate', () => {
  it("dà al banner l'id di policy della lingua della pagina", async () => {
    expect(await bannerPolicyId('/en/privacy')).toBe(ENGLISH_POLICY_ID)
    expect(await bannerPolicyId('/privacy')).toBe(POLICY_ID)
  })
})
