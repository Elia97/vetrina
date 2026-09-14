import { i18n } from 'astro:config/client'

import { localeTag, SITE } from '@/lib/site'

// Il prompt di installazione di Chrome vuole un'icona raster di almeno 192px (e una maskable
// da 512 col contenuto dentro la zona sicura centrale dell'80%); il template porta solo l'SVG.
const ICONS = [{ src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }] as const

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
    /* v8 ignore next -- astro:config/client lo inietta Astro a ogni render; il ripiego protegge un modulo che non può mancare */
    lang: localeTag(i18n?.defaultLocale ?? 'it'),
    dir: 'ltr',
    display: 'standalone',
    // La specifica del manifest non ha media query: un colore solo, quello del tema chiaro.
    background_color: SITE.themeColor.light,
    theme_color: SITE.themeColor.light,
    icons: ICONS,
  }
}
