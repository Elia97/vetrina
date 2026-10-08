import { DEFAULT_LOCALE } from '@/lib/site'

import { dictionaries, type UIKey, type UILocale } from './ui'

export type { UIKey } from './ui'

type NoSiteKeys = { readonly [P in UIKey]?: never }

export type DomainDictionaries<K extends string> = Record<UILocale, Record<K, string> & NoSiteKeys>

function isRegistered(locale: string): locale is UILocale {
  return Object.hasOwn(dictionaries, locale)
}

function registeredLocale(locale: string): UILocale {
  if (isRegistered(locale)) return locale
  if (isRegistered(DEFAULT_LOCALE)) return DEFAULT_LOCALE
  throw new Error(`No dictionary registered for the default locale "${DEFAULT_LOCALE}" — register it in src/i18n/ui.ts`)
}

export function useTranslations<K extends string = never>(
  locale?: string,
  domain?: DomainDictionaries<K>,
): (key: UIKey | K) => string {
  const code = registeredLocale(locale ?? DEFAULT_LOCALE)
  const dictionary: Readonly<Record<UIKey | K, string>> = Object.assign({}, dictionaries[code], domain?.[code])
  return (key) => dictionary[key]
}
