import { DEFAULT_LOCALE } from '@/lib/site'

const SECOND_LOCALE = 'en'
const LOCALES = [DEFAULT_LOCALE, SECOND_LOCALE]

export const twoLocaleConfig = {
  i18n: { defaultLocale: DEFAULT_LOCALE, locales: LOCALES },
}

export const translatedSegments = {
  SEGMENTS_BY_LOCALE: { [SECOND_LOCALE]: { contatti: 'contact' } },
}

export const translatedSlugPaths = {
  [DEFAULT_LOCALE]: '/prodotto/cintura-ipsc',
  [SECOND_LOCALE]: '/product/ipsc-belt',
}

export const twoLocaleManifest = {
  i18n: {
    strategy: 'pathname-prefix-other-locales' as const,
    locales: LOCALES,
    defaultLocale: DEFAULT_LOCALE,
    fallback: undefined,
    fallbackType: 'redirect' as const,
    domainLookupTable: {},
    domains: undefined,
  },
}
