import { z } from 'astro/zod'

import { consentField, emailField, requiredText } from '@/lib/forms/form-fields'
import { honeypotShape } from '@/lib/forms/honeypot-schema'

import { useTranslations } from '@/i18n/translate'

const t = useTranslations()

// [HARD] `required` nel markup significa obbligatorio qui: il form è `novalidate`
// (contact-form.astro), quindi questo schema è l'unico gate che gira su un invio.
export const contactSchema = z.object({
  ...honeypotShape,
  firstName: requiredText(t('forms.error.firstNameRequired')).max(100, {
    error: t('forms.error.firstNameTooLong'),
  }),
  lastName: requiredText(t('forms.error.lastNameRequired')).max(100, {
    error: t('forms.error.lastNameTooLong'),
  }),
  email: emailField,
  // Facoltativo anche nel markup: è l'unico campo su cui il form non insiste.
  message: z
    .string()
    .trim()
    .max(2000, { error: t('forms.error.messageTooLong') })
    .default(''),
  consent: consentField,
})

export type ContactRequest = z.infer<typeof contactSchema>

export function contactAttributes(request: ContactRequest): Record<string, string> {
  return {
    FIRSTNAME: request.firstName,
    LASTNAME: request.lastName,
  }
}
