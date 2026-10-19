import { i18n } from 'astro:config/client'

export type PageLocales = readonly string[] | Readonly<Record<string, string>>

function configuredLocales(): string[] {
  /* v8 ignore next -- la lingua singola di questo template non produce mai le voci locale a oggetto ({ path, codes }) */
  return (i18n?.locales ?? []).map((l) => (typeof l === 'string' ? l : (l.codes[0] ?? l.path)))
}

function isLocaleList(declared: PageLocales): declared is readonly string[] {
  return Array.isArray(declared)
}

export function pageLocales(declared?: PageLocales): string[] {
  const configured = configuredLocales()
  if (declared === undefined) return configured
  const codes = isLocaleList(declared) ? declared : Object.keys(declared)
  const unrouted = codes.find((code) => !configured.includes(code))
  if (unrouted !== undefined) {
    throw new Error(`The page declares locale "${unrouted}", which astro.config.mjs does not route`)
  }
  return configured.filter((code) => codes.includes(code))
}

export function declaredPath(declared: PageLocales | undefined, code: string): string | undefined {
  return declared === undefined || isLocaleList(declared) ? undefined : declared[code]
}

export function localeName(code: string): string {
  const name = new Intl.DisplayNames([code], { type: 'language', fallback: 'none' }).of(code)
  return name ? name.charAt(0).toLocaleUpperCase(code) + name.slice(1) : code
}
