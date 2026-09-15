import { DEFAULT_LOCALE } from '@/lib/site'

import { dictionaries, type UIKey } from './ui'

export type { UIKey } from './ui'

export function useTranslations(locale?: string): (key: UIKey) => string {
  const dict = dictionaries[locale ?? DEFAULT_LOCALE] ?? dictionaries[DEFAULT_LOCALE]
  if (!dict) {
    throw new Error(
      `No dictionary registered for the default locale "${DEFAULT_LOCALE}" — register it in src/i18n/ui.ts`,
    )
  }
  return (key: UIKey): string => dict[key]
}
