import { describe, expect, it, vi } from 'vitest'

import { declaredPath, localeName, pageLocales } from '@/i18n/locales'

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

  it("con una mappa prende le lingue dalle chiavi, nell'ordine della configurazione", () => {
    expect(pageLocales({ en: '/product/ipsc-belt', it: '/prodotto/cintura-ipsc' })).toEqual(['it', 'en'])
    expect(pageLocales({ it: '/prodotto/cintura-ipsc' })).toEqual(['it'])
  })

  it('ferma il build anche su una chiave della mappa che astro.config.mjs non instrada', () => {
    expect(() => pageLocales({ it: '/prodotto/cintura-ipsc', de: '/produkt/ipsc-guertel' })).toThrow('"de"')
  })
})

describe('declaredPath', () => {
  it('dà il percorso che la mappa porta per la lingua', () => {
    expect(declaredPath({ it: '/prodotto/cintura-ipsc', en: '/product/ipsc-belt' }, 'en')).toBe('/product/ipsc-belt')
  })

  it('non dà niente per una lingua che la mappa non porta, con la lista o senza dichiarazione', () => {
    expect(declaredPath({ it: '/prodotto/cintura-ipsc' }, 'en')).toBeUndefined()
    expect(declaredPath(['it', 'en'], 'en')).toBeUndefined()
    expect(declaredPath(undefined, 'en')).toBeUndefined()
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
