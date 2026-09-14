import type { APIRoute } from 'astro'

// È `prerender = false` a rendere `ts` un segnale di freschezza: prerenderizzato, verrebbe
// stampato una volta in fase di build e l'endpoint risponderebbe 200 per sempre.
export const prerender = false

export const GET: APIRoute = () =>
  new Response(JSON.stringify({ status: 'ok', ts: new Date().toISOString() }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
      'X-Robots-Tag': 'noindex',
    },
  })
