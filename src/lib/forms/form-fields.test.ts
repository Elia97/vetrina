import { z } from 'astro/zod'
import { describe, expect, it, vi } from 'vitest'

import { consentField, emailField, requiredText, schemaByLocale } from '@/lib/forms/form-fields'
import { DEFAULT_LOCALE } from '@/lib/site'

import { useTranslations } from '@/i18n/translate'
import { dictionaries } from '@/i18n/ui'

vi.mock('astro:config/client', () => import('@test/helpers/second-locale').then((m) => m.twoLocaleConfig))
vi.mock('@/i18n/ui', async (importOriginal) => {
  const { withSecondLocaleDictionary } = await import('@test/helpers/second-locale')
  return withSecondLocaleDictionary(await importOriginal())
})

type Issue = { message: string; path: PropertyKey[] }

function firstIssue(
  schema: { safeParse: (value: unknown) => { success: boolean; error?: { issues: Issue[] } } },
  value: unknown,
): Issue | undefined {
  const result = schema.safeParse(value)
  return result.success ? undefined : result.error?.issues[0]
}

const LOCALES = Object.keys(dictionaries)

// I messaggi predefiniti di Zod sono in inglese ("Invalid email") e arrivano all'utente tali
// e quali, quindi ogni messaggio che il form può emettere deve venire dal dizionario.
describe.each(LOCALES)('i messaggi di validazione in %s vengono dal suo dizionario', (locale) => {
  const t = useTranslations(locale)

  it("segnala un'email non valida", () => {
    expect(firstIssue(emailField(locale), 'not-an-email')?.message).toBe(t('forms.error.emailInvalid'))
  })

  it("segnala un'email troppo lunga", () => {
    expect(firstIssue(emailField(locale), `${'a'.repeat(250)}@example.com`)?.message).toBe(
      t('forms.error.emailTooLong'),
    )
  })

  it('segnala un consenso negato', () => {
    expect(firstIssue(consentField(locale), false)?.message).toBe(t('forms.error.consentRequired'))
  })
})

describe('requiredText', () => {
  it('carries its message through both the missing and the empty case', () => {
    const field = requiredText('compila')
    expect(firstIssue(field, undefined)?.message).toBe('compila')
    expect(firstIssue(field, '')?.message).toBe('compila')
    expect(firstIssue(field, '   ')?.message).toBe('compila')
  })
})

describe('schemaByLocale', () => {
  const schema = schemaByLocale((locale) =>
    z.object({
      locale: z.literal(locale),
      firstName: requiredText(useTranslations(locale)('forms.error.firstNameRequired')),
    }),
  )

  it.each(LOCALES)('valida un payload in %s con i messaggi di quella lingua', (locale) => {
    expect(firstIssue(schema, { locale, firstName: '' })).toEqual(
      expect.objectContaining({
        path: ['firstName'],
        message: useTranslations(locale)('forms.error.firstNameRequired'),
      }),
    )
  })

  it.each([
    ['senza lingua', {}],
    ['con una lingua che il sito non instrada', { locale: 'fr' }],
  ])('rifiuta un payload %s, e chiede nella lingua di default di ricaricare la pagina', (_case, payload) => {
    expect(firstIssue(schema, { ...payload, firstName: 'Ada' })).toEqual(
      expect.objectContaining({ path: ['locale'], message: useTranslations(DEFAULT_LOCALE)('forms.error.reload') }),
    )
  })
})
