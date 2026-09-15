import { describe, expect, it, vi } from 'vitest'

import { localeName, pageLocales } from '@/i18n/locales'

vi.mock('astro:config/client', () => import('@test/helpers/second-locale').then((m) => m.twoLocaleConfig))

describe('pageLocales', () => {
  it('senza dichiarazione restituisce tutte le lingue configurate', () => {
    expect(pageLocales()).toEqual(['it', 'en'])
  })

  it("tiene le lingue dichiarate nell'ordine della configurazione", () => {
    expect(pageLocales(['en', 'it'])).toEqual(['it', 'en'])
    expect(pageLocales(['en'])).toEqual(['en'])
  })

  it('ferma il build su una lingua che astro.config.mjs non instrada', () => {
    expect(() => pageLocales(['it', 'de'])).toThrow('"de"')
  })
})

describe('localeName', () => {
  it.each([
    ['it', 'Italiano'],
    ['en', 'English'],
  ])('dà il nome di %s nella sua lingua, con la maiuscola', (code, name) => {
    expect(localeName(code)).toBe(name)
  })

  it('ripiega sul codice di una lingua che non ha un nome', () => {
    expect(localeName('zz')).toBe('zz')
  })
})
