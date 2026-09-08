import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

import { SITE } from '@/lib/site'

// vercel.json ha effetto solo sul bordo e `astro dev` non lo legge mai, quindi la CI è
// l'unico posto in cui queste due regole vengono provate.

type HasCondition = { type: string; value?: string }
type Redirect = {
  source: string
  has?: HasCondition[]
  destination: string
  permanent?: boolean
}
type VercelConfig = { regions?: string[]; redirects?: Redirect[] }

const config = JSON.parse(
  readFileSync(fileURLToPath(new URL('../vercel.json', import.meta.url)), 'utf8'),
) as VercelConfig

const apex = new URL(SITE.url).host
const wwwRedirect = config.redirects?.find((rule) => rule.has?.some((cond) => cond.type === 'host'))

describe('vercel.json www → apex redirect', () => {
  // [HARD] Verificato contro SITE.url, mai un letterale: un fork che cambia marchio e
  // dimentica vercel.json fallisce qui.
  it('redirects the www host of SITE.url, whatever that is', () => {
    expect(wwwRedirect, 'no host-conditioned redirect in vercel.json').toBeDefined()

    const pattern = wwwRedirect?.has?.find((cond) => cond.type === 'host')?.value
    expect(pattern).toBeDefined()
    const host = new RegExp(`^(?:${pattern ?? ''})$`)

    expect(host.test(`www.${apex}`), `pattern "${pattern ?? ''}" must match www.${apex} — update vercel.json`).toBe(
      true,
    )
    expect(host.test(apex)).toBe(false)
  })

  it('sends every path to the same path on the apex', () => {
    expect(wwwRedirect?.source).toBe('/:path*')
    expect(wwwRedirect?.destination).toBe(`${SITE.url}/:path*`)
  })

  // Vercel emette un 308 per `permanent: true` — permanente e che preserva il metodo.
  it('is permanent', () => {
    expect(wwwRedirect?.permanent).toBe(true)
  })
})

describe('vercel.json function region', () => {
  // Lasciata vuota, Vercel usa iad1 (Washington); il pubblico è europeo.
  it('pins functions to fra1', () => {
    expect(config.regions).toEqual(['fra1'])
  })
})
