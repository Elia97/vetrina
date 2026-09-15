import { DEFAULT_LOCALE, localeTag, SITE } from '@/lib/site'

const ICONS = [
  { src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
  { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
  { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
  { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
] as const

export function buildWebManifest() {
  return {
    // Cambiare `id` fa sì che i browser trattino il sito come un'altra applicazione:
    // l'installazione smette di aggiornarsi e il prompt ricompare.
    id: '/',
    start_url: '/',
    scope: '/',
    name: SITE.name,
    short_name: SITE.name,
    description: SITE.description,
    lang: localeTag(DEFAULT_LOCALE),
    dir: 'ltr',
    display: 'standalone',
    // La specifica del manifest non ha media query: un colore solo, quello del tema chiaro.
    background_color: SITE.themeColor.light,
    theme_color: SITE.themeColor.light,
    icons: ICONS,
  }
}
