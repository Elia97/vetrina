import { i18n } from 'astro:config/client'

import { dictionaries, type UIKey } from './ui'

export type { UIKey } from './ui'

export function useTranslations(locale?: string): (key: UIKey) => string {
  /* v8 ignore next -- astro:config/client lo inietta Astro a ogni render; il ripiego protegge un modulo che non può mancare */
  const defaultLocale = i18n?.defaultLocale ?? 'it'
  const dict = dictionaries[locale ?? defaultLocale] ?? dictionaries[defaultLocale]
  if (!dict) {
    throw new Error(
      `No dictionary registered for the default locale "${defaultLocale}" — register it in src/i18n/ui.ts`,
    )
  }
  return (key: UIKey): string => dict[key]
}
