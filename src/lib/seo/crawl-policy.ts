// Letto da src/pages/robots.txt.ts, dal filtro sitemap in astro.config.mjs e da
// src/middleware.ts.

// [HARD] Senza import: astro.config.mjs si carica prima che Vite risolva l'alias `@/`, quindi
// da lì sono raggiungibili solo i moduli che non importano niente.

/** Una voce di sitemap per un URL bloccato da robots è un avviso in Search Console, quindi
 *  questi restano fuori anche dalla sitemap. */
export const ROBOTS_DISALLOWED_PATHS: readonly string[] = []

/** Anche src/middleware.ts legge questa lista, ma arriva solo alle risposte SSR non HTML: su
 *  una pagina prerenderizzata a portare il segnale è il meta `noindex` del layout. */
export const NOINDEX_PATHS: readonly string[] = []

/** @astrojs/sitemap scarta da sé le pagine di stato, quindi `/404` e `/500` non ci sono. */
export const SITEMAP_EXCLUDED_PATHS: readonly string[] = [...ROBOTS_DISALLOWED_PATHS, ...NOINDEX_PATHS]

/** @astrojs/sitemap consegna le voci assolute e con lo slash finale nonostante
 *  `trailingSlash: 'never'`. */
export function crawlPathname(url: string): string {
  const { pathname } = new URL(url, 'https://placeholder.invalid')
  return pathname.length > 1 ? pathname.replace(/\/$/, '') : pathname
}

/** [HARD] Sottoalbero, mai uguaglianza: `/area-riservata` in NOINDEX_PATHS copre
 *  `/area-riservata/documenti`, e quando non lo fa non fallisce niente. */
export function matchesSubtree(pathname: string, roots: readonly string[]): boolean {
  const path = crawlPathname(pathname)
  return roots.some((root) => path === root || path.startsWith(`${root}/`))
}

export function isExcludedFromSitemap(url: string): boolean {
  return matchesSubtree(url, SITEMAP_EXCLUDED_PATHS)
}

export function isNoindexPath(pathname: string): boolean {
  return matchesSubtree(pathname, NOINDEX_PATHS)
}
