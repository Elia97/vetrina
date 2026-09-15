import { z } from 'astro/zod'

import { useTranslations } from '@/i18n/translate'

// Lingua di default, sempre: la richiesta di un'azione arriva su /_actions/<nome>, dove
// Astro.currentLocale è la lingua di default qualunque sia la pagina.
const t = useTranslations()

/** [HARD] Un campo marcato `required` nel markup usa questo, non `.default('')`: il form è
 *  `novalidate`, quindi questo schema è l'unico gate che gira su un invio. */
export function requiredText(message: string) {
  return z.string({ error: message }).trim().min(1, { error: message })
}

export const emailField = z
  .string({ error: t('forms.error.emailInvalid') })
  .trim()
  .max(254, { error: t('forms.error.emailTooLong') })
  .pipe(z.email({ error: t('forms.error.emailInvalid') }))

export const consentField = z.literal(true, { error: t('forms.error.consentRequired') })
