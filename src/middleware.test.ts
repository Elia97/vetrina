import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { collectInlineScriptHashes } from '@/lib/csp/html'
import { isNoindexPath } from '@/lib/seo/crawl-policy'

// Le due liste arrivano vuote, quindi niente esercita il ramo positivo finché un fork non
// aggiunge la sua prima voce in NOINDEX_PATHS.
vi.mock('@/lib/seo/crawl-policy')

async function run(pathname: string, downstream = new Response('body'), isPrerendered = false): Promise<Response> {
  const { onRequest } = await import('@/middleware')
  const context = { url: new URL(`https://example.test${pathname}`), isPrerendered }
  const next = () => Promise.resolve(downstream)
  return (await (onRequest as unknown as (c: unknown, n: unknown) => Promise<Response>)(context, next)) as Response
}

const PAGE =
  '<!doctype html><html><head><meta charset="utf-8"><title>Sign in</title><script>a=1</script></head><body></body></html>'

const htmlResponse = (headers: Record<string, string> = {}, status = 200): Response =>
  new Response(PAGE, { status, headers: { 'Content-Type': 'text/html; charset=utf-8', ...headers } })

beforeEach(() => {
  vi.resetModules()
  vi.mocked(isNoindexPath).mockReset()
})

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('X-Robots-Tag middleware', () => {
  it('tags a path the crawl policy keeps out of the index', async () => {
    vi.mocked(isNoindexPath).mockReturnValue(true)

    const response = await run('/area-riservata/documenti')

    expect(response.headers.get('X-Robots-Tag')).toBe('noindex, nofollow')
  })

  it('leaves an indexable path untouched', async () => {
    vi.mocked(isNoindexPath).mockReturnValue(false)

    const response = await run('/contatti')

    expect(response.headers.get('X-Robots-Tag')).toBeNull()
  })

  it('asks the policy about the pathname, never the full URL', async () => {
    vi.mocked(isNoindexPath).mockReturnValue(false)

    await run('/area-riservata?utm=x')

    expect(isNoindexPath).toHaveBeenCalledWith('/area-riservata')
  })

  // Non fa altro che decorare: inghiottire o sostituire la risposta a valle si porterebbe
  // via tutte le altre intestazioni.
  it('passes the downstream response through with its own headers intact', async () => {
    vi.mocked(isNoindexPath).mockReturnValue(true)

    const response = await run('/feed.json', new Response('body', { headers: { 'Content-Type': 'application/json' } }))

    expect(response.headers.get('Content-Type')).toBe('application/json')
    expect(await response.text()).toBe('body')
  })
})

describe('la CSP delle pagine rese a richiesta', () => {
  it('mette la policy degli script della pagina subito dopo <meta charset>', async () => {
    const response = await run('/login', htmlResponse())

    const body = await response.text()
    const [hash] = collectInlineScriptHashes(PAGE)
    expect(body).toMatch(/<meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="[^"]+"><title>/)
    expect(body).toContain(`'${hash}'`)
  })

  it('lascia intatta una pagina prerenderizzata, la cui policy la scrive la build', async () => {
    const response = await run('/about', htmlResponse(), true)

    expect(await response.text()).toBe(PAGE)
  })

  it('lascia intatta una risposta che non è HTML', async () => {
    const json = '{"status":"ok"}'

    const response = await run('/api/health', new Response(json, { headers: { 'Content-Type': 'application/json' } }))

    expect(await response.text()).toBe(json)
  })

  it('lascia intatta una risposta senza Content-Type', async () => {
    const response = await run('/login', new Response(new TextEncoder().encode(PAGE)))

    expect(await response.text()).toBe(PAGE)
  })

  it('tiene stato e intestazioni, tranne la lunghezza del corpo che cambia', async () => {
    vi.mocked(isNoindexPath).mockReturnValue(true)

    const response = await run('/login', htmlResponse({ 'Cache-Control': 'no-store', 'Content-Length': '120' }, 404))

    expect(response.status).toBe(404)
    expect(response.headers.get('Cache-Control')).toBe('no-store')
    expect(response.headers.get('X-Robots-Tag')).toBe('noindex, nofollow')
    expect(response.headers.get('Content-Length')).toBeNull()
  })

  it('lascia passare una risposta HTML senza corpo, che non ne può avere uno', async () => {
    const downstream = new Response(null, { status: 204, headers: { 'Content-Type': 'text/html' } })

    const response = await run('/login', downstream)

    expect(response).toBe(downstream)
  })

  it('apre la policy alla toolbar su un deploy di preview', async () => {
    vi.stubEnv('VERCEL_ENV', 'preview')

    const response = await run('/login', htmlResponse())

    expect(await response.text()).toContain('https://vercel.live')
  })
})
