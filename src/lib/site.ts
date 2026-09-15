export const DEFAULT_LOCALE = 'it'

export const SITE = {
  name: '<PROJECT_NAME>',
  // Alimenta `site` in astro.config.mjs e ogni URL assoluto canonical/OG/hreflang.
  url: 'https://example.com',
  description: '<DESCRIPTION>',
  defaultOgImage: '/og-default.png',
  defaultOgImageSize: { width: 1200, height: 630 },
  // In esadecimale, non oklch: `<meta name="theme-color">` lo interpreta lo strato di interfaccia del browser, non il motore CSS.
  themeColor: { light: '#fafafa', dark: '#0a0a0a' },
  // Le chiavi devono corrispondere ai codici di lingua in `i18n.locales` (astro.config.mjs):
  // per una voce oggetto è `codes[0]`, non `path`; lo verifica src/i18n/locale-config.test.ts.
  localeTags: { it: 'it-IT' },
  // `href` è il percorso nella lingua di default: localizedHref() aggiunge il prefisso per lingua.
  nav: [
    { key: 'nav.home', href: '/' },
    { key: 'nav.contact', href: '/contatti' },
  ],
  cta: { key: 'nav.cta', href: '/contatti' },
  legal: [
    { key: 'legal.terms', href: '/termini' },
    { key: 'legal.privacy', href: '/privacy' },
    { key: 'legal.cookies', href: '/cookie-policy' },
  ],
  social: [{ label: 'LinkedIn', href: '#' }],
} as const

/** @public */
export type Site = typeof SITE

export function localeTag(locale: string): string {
  const tags: Record<string, string> = SITE.localeTags
  return tags[locale] ?? locale
}
