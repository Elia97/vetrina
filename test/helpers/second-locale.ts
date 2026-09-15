import { DEFAULT_LOCALE } from '@/lib/site'

const SECOND_LOCALE = 'en'

export const twoLocaleConfig = {
  i18n: { defaultLocale: DEFAULT_LOCALE, locales: [DEFAULT_LOCALE, SECOND_LOCALE] },
}

export const translatedSegments = {
  SEGMENTS_BY_LOCALE: { [SECOND_LOCALE]: { contatti: 'contact' } },
}
