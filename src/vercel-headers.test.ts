import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

// `astro dev` non legge mai vercel.json: la CI è l'unico posto in cui queste intestazioni girano
// prima di un deploy. Ogni altra direttiva CSP sta in src/lib/csp/, coperta da csp.test.ts.

type HeaderEntry = { key: string; value: string }
type HeaderRule = { source: string; has?: unknown[]; headers: HeaderEntry[] }
type Rewrite = { source: string; destination: string }
type VercelConfig = { headers: HeaderRule[]; rewrites: Rewrite[] }

const config = JSON.parse(
  readFileSync(fileURLToPath(new URL('../vercel.json', import.meta.url)), 'utf8'),
) as VercelConfig

const globalRule = config.headers.find((rule) => rule.source === '/(.*)' && !rule.has)
if (!globalRule) throw new Error('vercel.json: no unconditional "/(.*)" header rule')

function header(key: string): string {
  const entry = globalRule?.headers.find((e) => e.key.toLowerCase() === key.toLowerCase())
  if (!entry) throw new Error(`vercel.json: missing "${key}" header`)
  return entry.value
}

// Le asserzioni riguardano la politica, non l'ordine o la spaziatura di una lunga stringa.
const directives = new Map(
  header('Content-Security-Policy')
    .split(';')
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part): [string, string[]] => {
      const [name = '', ...values] = part.split(/\s+/)
      return [name, values]
    }),
)

const sources = (directive: string): string[] => directives.get(directive) ?? []

describe('security headers', () => {
  // Un'intestazione tolta in silenzio dall'elenco è un peggioramento che nient'altro
  // segnalerebbe: il sito continua a funzionare, solo meno al sicuro.
  it('carries the full set on every response', () => {
    expect(globalRule?.headers.map((entry) => entry.key).sort()).toEqual([
      'Content-Security-Policy',
      'Permissions-Policy',
      'Referrer-Policy',
      'Strict-Transport-Security',
      'X-Content-Type-Options',
      'X-Frame-Options',
    ])
  })

  it('refuses framing and MIME sniffing', () => {
    expect(header('X-Frame-Options')).toBe('DENY')
    expect(header('X-Content-Type-Options')).toBe('nosniff')
  })

  it('never leaks a full URL cross-origin in the referrer', () => {
    expect(['strict-origin-when-cross-origin', 'no-referrer', 'same-origin']).toContain(header('Referrer-Policy'))
  })

  // Due anni è quello che richiede l'iscrizione alla preload list HSTS, e abbassarlo ha effetto
  // solo alla scadenza: fino a lì il browser applica il max-age che ha già.
  it('pins HSTS at a preload-eligible value', () => {
    const hsts = header('Strict-Transport-Security')
    const maxAge = Number(/max-age=(\d+)/.exec(hsts)?.[1])
    expect(maxAge).toBeGreaterThanOrEqual(31536000)
    expect(hsts).toContain('includeSubDomains')
    expect(hsts).toContain('preload')
  })

  it('denies the sensitive browser features', () => {
    const policy = header('Permissions-Policy')
    for (const feature of ['camera', 'microphone', 'geolocation']) {
      expect(policy).toContain(`${feature}=()`)
    }
  })
})

describe('Content-Security-Policy', () => {
  it('carries frame-ancestors, the one directive a meta CSP cannot express', () => {
    // Ridondante con l'X-Frame-Options qui sopra, e di proposito: quella intestazione è
    // quella che i browser più vecchi rispettano, questa è quella davvero specificata.
    expect(sources('frame-ancestors')).toEqual(["'none'"])
  })

  it('leaves every other directive to the build-time policy', () => {
    // La specifica CSP applica più policy in modo indipendente, quindi una copia qui si
    // intersecherebbe con src/lib/csp/directives.ts invece di sostituirla.
    for (const directive of ['default-src', 'script-src', 'style-src', 'connect-src', 'img-src']) {
      expect(sources(directive), directive).toEqual([])
    }
  })

  it('allows no wildcard and no plaintext origin anywhere', () => {
    for (const [directive, values] of directives) {
      expect(values, directive).not.toContain('*')
      expect(
        values.filter((value) => value.startsWith('http:')),
        directive,
      ).toEqual([])
    }
  })

  // vercel-botid.test.ts fissa i rewrite da cui questo dipende.
  it('needs no vendor origin for BotID, because the challenge is same-origin', () => {
    expect(config.rewrites.some((rule) => rule.destination.includes('api.vercel.com'))).toBe(true)
    for (const [, values] of directives) {
      expect(values.join(' ')).not.toContain('api.vercel.com')
    }
  })
})
