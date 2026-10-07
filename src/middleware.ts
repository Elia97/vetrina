import { defineMiddleware } from 'astro:middleware'
import process from 'node:process'

import { buildCspContent } from '@/lib/csp/directives'
import { collectInlineScriptHashes, injectCspMeta } from '@/lib/csp/html'
import { isNoindexPath } from '@/lib/seo/crawl-policy'

// [HARD] Intestazioni, più la CSP nell'HTML reso a richiesta. Col middlewareMode di default
// dell'adapter una pagina prerenderizzata lo esegue una volta in build, contro una richiesta
// sintetica: la sua CSP la scrive cspIntegration(), e per ramificare si usa `prerender = false`.

const HTML_MEDIA_TYPE = /^text\/html\s*(?:;|$)/i

async function withCspMeta(response: Response): Promise<Response> {
  const html = await response.text()
  const csp = buildCspContent(collectInlineScriptHashes(html), process.env.VERCEL_ENV)
  const headers = new Headers(response.headers)
  headers.delete('Content-Length')
  return new Response(injectCspMeta(html, csp), {
    status: response.status,
    statusText: response.statusText,
    headers,
  })
}

export const onRequest = defineMiddleware(async (context, next) => {
  const response = await next()

  if (isNoindexPath(context.url.pathname)) {
    response.headers.set('X-Robots-Tag', 'noindex, nofollow')
  }

  if (context.isPrerendered || response.body === null) return response
  if (!HTML_MEDIA_TYPE.test(response.headers.get('Content-Type') ?? '')) return response
  return withCspMeta(response)
})
