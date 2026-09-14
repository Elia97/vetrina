import { defineMiddleware } from 'astro:middleware'

import { isNoindexPath } from '@/lib/seo/crawl-policy'

// [HARD] Solo impostazione di intestazioni. Col middlewareMode di default dell'adapter, una
// pagina prerenderizzata lo esegue una volta in fase di build contro una richiesta sintetica:
// se serve ramificare, si usa `prerender = false`.

export const onRequest = defineMiddleware(async (context, next) => {
  const response = await next()

  if (isNoindexPath(context.url.pathname)) {
    response.headers.set('X-Robots-Tag', 'noindex, nofollow')
  }

  return response
})
