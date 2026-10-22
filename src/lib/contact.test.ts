import { describe, expect, it, vi } from 'vitest'

import { contactSchema } from '@/lib/contact'
import { DEFAULT_LOCALE } from '@/lib/site'

import { useTranslations } from '@/i18n/translate'

vi.mock('astro:config/client', () => import('@test/helpers/second-locale').then((m) => m.twoLocaleConfig))
vi.mock('@/i18n/ui', async (importOriginal) => {
  const { withSecondLocaleDictionary } = await import('@test/helpers/second-locale')
  return withSecondLocaleDictionary(await importOriginal())
})

const valid = {
  locale: DEFAULT_LOCALE,
  firstName: 'Ada',
  lastName: 'Lovelace',
  email: 'ada@example.com',
  message: 'Hello',
  consent: true,
} as const

// [HARD] Parità con `required` del markup: il form è novalidate (contact-form.astro).
describe('required parity with the markup', () => {
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

describe('la lingua del payload', () => {
  it('dà gli errori di campo nella lingua di chi scrive', () => {
    const result = contactSchema.safeParse({ ...valid, locale: 'en', firstName: '' })

    expect(result.error?.issues.map((issue) => issue.message)).toEqual([
      useTranslations('en')('forms.error.firstNameRequired'),
    ])
  })
})
