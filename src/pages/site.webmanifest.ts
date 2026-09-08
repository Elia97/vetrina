import type { APIRoute } from 'astro'

import { buildWebManifest } from '@/lib/seo/manifest'

// La produzione lo serve come file statico, col MIME che viene dall'estensione
// `.webmanifest`; l'intestazione è quella con cui rispondono lo sviluppo e `astro preview`.
export const GET: APIRoute = () =>
  new Response(JSON.stringify(buildWebManifest()), {
    headers: { 'Content-Type': 'application/manifest+json; charset=utf-8' },
  })
