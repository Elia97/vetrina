import { emailField, requiredText } from '@/lib/forms/form-fields'

import { useTranslations } from '@/i18n/translate'

export function identityShape(locale: string) {
  const t = useTranslations(locale)
  return {
    firstName: requiredText(t('forms.error.firstNameRequired')).max(100, {
      error: t('forms.error.firstNameTooLong'),
    }),
    lastName: requiredText(t('forms.error.lastNameRequired')).max(100, {
      error: t('forms.error.lastNameTooLong'),
    }),
    email: emailField(locale),
  }
}
