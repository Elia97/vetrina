import type { APIRoute } from 'astro'

import { ROBOTS_DISALLOWED_PATHS } from '@/lib/seo/crawl-policy'

// I crawler mettono in cache robots.txt, quindi il noindex delle preview non si fa qui: se ne
// occupa per singola risposta la regola di intestazione su *.vercel.app in vercel.json.
export const GET: APIRoute = ({ site }) => {
  const base = site ?? new URL('http://localhost:4321/')
  const sitemapUrl = new URL('sitemap-index.xml', base).href

  const rules = ['User-agent: *', 'Allow: /', ...ROBOTS_DISALLOWED_PATHS.map((path) => `Disallow: ${path}`)]
  const body = `${rules.join('\n')}\n\nSitemap: ${sitemapUrl}\n`

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
