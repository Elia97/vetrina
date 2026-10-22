import { z } from 'astro/zod'

import { DEFAULT_LOCALE } from '@/lib/site'

import { pageLocales } from '@/i18n/locales'
import { useTranslations } from '@/i18n/translate'

/** [HARD] Un campo marcato `required` nel markup usa questo, non `.default('')`: il form è
 *  `novalidate`, quindi questo schema è l'unico gate che gira su un invio. */
export function requiredText(message: string) {
  return z.string({ error: message }).trim().min(1, { error: message })
}

export function emailField(locale: string) {
  const t = useTranslations(locale)
  return z
    .string({ error: t('forms.error.emailInvalid') })
    .trim()
    .max(254, { error: t('forms.error.emailTooLong') })
    .pipe(z.email({ error: t('forms.error.emailInvalid') }))
}

export function consentField(locale: string) {
  return z.literal(true, { error: useTranslations(locale)('forms.error.consentRequired') })
}

// Su /_actions/<nome> Astro.currentLocale è sempre la lingua di default, qualunque sia la pagina.
export function schemaByLocale<Schema extends z.ZodObject>(schemaFor: (locale: string) => Schema) {
  const [first = DEFAULT_LOCALE, ...rest] = pageLocales()
  return z.discriminatedUnion('locale', [schemaFor(first), ...rest.map(schemaFor)], {
    error: useTranslations()('forms.error.reload'),
  })
}
