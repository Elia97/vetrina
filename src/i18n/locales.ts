import { i18n } from 'astro:config/client'

function configuredLocales(): string[] {
  /* v8 ignore next -- la lingua singola di questo template non produce mai le voci locale a oggetto ({ path, codes }) */
  return (i18n?.locales ?? []).map((l) => (typeof l === 'string' ? l : (l.codes[0] ?? l.path)))
}

export function pageLocales(declared?: readonly string[]): string[] {
  const configured = configuredLocales()
  if (declared === undefined) return configured
  const unrouted = declared.find((code) => !configured.includes(code))
  if (unrouted !== undefined) {
    throw new Error(`The page declares locale "${unrouted}", which astro.config.mjs does not route`)
  }
  return configured.filter((code) => declared.includes(code))
}

export function localeName(code: string): string {
  const name = new Intl.DisplayNames([code], { type: 'language', fallback: 'none' }).of(code)
  return name ? name.charAt(0).toLocaleUpperCase(code) + name.slice(1) : code
}
