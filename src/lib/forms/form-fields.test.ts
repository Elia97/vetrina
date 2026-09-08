import { describe, expect, it } from 'vitest'

import { contactSchema } from '@/lib/contact'
import { consentField, emailField, requiredText } from '@/lib/forms/form-fields'

import { it as dictionary } from '@/i18n/strings/it'

function messageFor(
  schema: { safeParse: (value: unknown) => { success: boolean; error?: { issues: { message: string }[] } } },
  value: unknown,
): string | undefined {
  const result = schema.safeParse(value)
  return result.success ? undefined : result.error?.issues[0]?.message
}

// I messaggi predefiniti di Zod sono in inglese ("Invalid email") e arrivano all'utente tali
// e quali, quindi ogni messaggio che il form può emettere deve venire dal dizionario.
describe('validation messages come from the dictionary', () => {
  it('reports an invalid email in the site language', () => {
    expect(messageFor(emailField, 'not-an-email')).toBe(dictionary['forms.error.emailInvalid'])
  })

  it('reports an over-long email in the site language', () => {
    expect(messageFor(emailField, `${'a'.repeat(250)}@example.com`)).toBe(dictionary['forms.error.emailTooLong'])
  })

  it('reports a refused consent in the site language', () => {
    expect(messageFor(consentField, false)).toBe(dictionary['forms.error.consentRequired'])
  })

  it('carries its message through both the missing and the empty case', () => {
    const field = requiredText('compila')
    expect(messageFor(field, undefined)).toBe('compila')
    expect(messageFor(field, '')).toBe('compila')
    expect(messageFor(field, '   ')).toBe('compila')
  })
})

// [HARD] Parità col markup: un campo che porta `required` deve fallire qui su un invio
// vuoto. Il form è novalidate, quindi non lo impone nient'altro.
describe('required parity with the markup', () => {
  const valid = {
    firstName: 'Ada',
    lastName: 'Lovelace',
    email: 'ada@example.com',
    message: 'Ciao',
    consent: true,
  } as const

  it('accepts a complete submission', () => {
    expect(contactSchema.safeParse(valid).success).toBe(true)
  })

  for (const field of ['firstName', 'lastName', 'email'] as const) {
    it(`rejects an empty ${field}`, () => {
      expect(contactSchema.safeParse({ ...valid, [field]: '' }).success).toBe(false)
    })
  }

  it('rejects a missing consent', () => {
    expect(contactSchema.safeParse({ ...valid, consent: false }).success).toBe(false)
  })

  it('accepts an empty message', () => {
    expect(contactSchema.safeParse({ ...valid, message: '' }).success).toBe(true)
  })
})
