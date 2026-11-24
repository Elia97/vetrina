import { z } from 'astro/zod'

import { consentField, schemaByLocale } from '@/lib/forms/form-fields'
import { honeypotShape } from '@/lib/forms/honeypot-schema'
import { identityShape } from '@/lib/forms/identity-fields'

import { useTranslations } from '@/i18n/translate'

function contactSchemaFor(locale: string) {
  const t = useTranslations(locale)
  // [HARD] Il form è `novalidate` (contact-form.astro): `required` nel markup vale solo se è qui.
  return z.object({
    locale: z.literal(locale),
    ...honeypotShape,
    ...identityShape(locale),
    message: z
      .string()
      .trim()
      .max(2000, { error: t('forms.error.messageTooLong') })
      .default(''),
    consent: consentField(locale),
  })
}

export const contactSchema = schemaByLocale(contactSchemaFor)

export type ContactRequest = z.infer<typeof contactSchema>

export function contactAttributes(request: ContactRequest): Record<string, string> {
  return {
    FIRSTNAME: request.firstName,
    LASTNAME: request.lastName,
  }
}

export function leadRecoveryRecord(request: ContactRequest) {
  return {
    firstName: request.firstName,
    lastName: request.lastName,
    email: request.email,
    locale: request.locale,
    messageLength: request.message.length,
  }
}
