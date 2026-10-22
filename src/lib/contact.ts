import { z } from 'astro/zod'

import { consentField, emailField, requiredText, schemaByLocale } from '@/lib/forms/form-fields'
import { honeypotShape } from '@/lib/forms/honeypot-schema'

import { useTranslations } from '@/i18n/translate'

function contactSchemaFor(locale: string) {
  const t = useTranslations(locale)
  // [HARD] Il form è `novalidate` (contact-form.astro): `required` nel markup vale solo se è qui.
  return z.object({
    locale: z.literal(locale),
    ...honeypotShape,
    firstName: requiredText(t('forms.error.firstNameRequired')).max(100, {
      error: t('forms.error.firstNameTooLong'),
    }),
    lastName: requiredText(t('forms.error.lastNameRequired')).max(100, {
      error: t('forms.error.lastNameTooLong'),
    }),
    email: emailField(locale),
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
