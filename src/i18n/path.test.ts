import { describe, expect, it } from 'vitest'

import { localizedHref } from '@/i18n/href'
import { ariaCurrent, localeAgnosticPath } from '@/i18n/path'

// Un canonical che non concorda con la pagina su cui sta viene ignorato dai motori di ricerca.
describe('localeAgnosticPath', () => {
  it('leaves a default-locale path as it is', () => {
    expect(localeAgnosticPath('/contatti', 'it')).toBe('/contatti')
  })

  it('strips the prefix of a secondary locale', () => {
    expect(localeAgnosticPath('/en/contatti', 'en')).toBe('/contatti')
  })

  it('reduces a bare locale prefix to the root', () => {
    expect(localeAgnosticPath('/en', 'en')).toBe('/')
  })

  it('does not strip a prefix that only looks like one', () => {
    expect(localeAgnosticPath('/enoteca', 'en')).toBe('/enoteca')
  })

  it('keeps the root as the root', () => {
    expect(localeAgnosticPath('/', 'it')).toBe('/')
  })

  // `trailingSlash: 'never'` (astro.config.mjs): un canonical che ce l'ha fa concorrenza
  // all'URL della pagina stessa per lo stesso contenuto.
  it.each([
    ['/contatti/', '/contatti'],
    ['/contatti///', '/contatti'],
  ])('normalizes %s to %s', (input, expected) => {
    expect(localeAgnosticPath(input, 'it')).toBe(expected)
  })

  it('normalizes a stripped prefix that leaves a trailing slash', () => {
    expect(localeAgnosticPath('/en/', 'en')).toBe('/')
  })

  // Un canonical vuoto si risolve contro l'origine, non contro la pagina.
  it('recovers the root from a path that is only slashes', () => {
    expect(localeAgnosticPath('///', 'it')).toBe('/')
  })
})

describe('ariaCurrent', () => {
  it.each([
    ['/', 'it'],
    ['/en', 'en'],
  ])('marca la home come pagina corrente su %s (%s)', (pathname, locale) => {
    expect(ariaCurrent('/', pathname, locale)).toBe('page')
  })

  it('marca la voce di una pagina interna quando è quella aperta', () => {
    expect(ariaCurrent('/contatti', '/contatti', 'it')).toBe('page')
  })

  it('marca la stessa voce anche con lo slash finale', () => {
    expect(ariaCurrent('/contatti', '/contatti/', 'it')).toBe('page')
  })

  it('marca come sezione la voce di cui la pagina aperta è una sottopagina', () => {
    expect(ariaCurrent('/work', '/work/case-study', 'it')).toBe('true')
  })

  it('non fa mai della home la sezione delle altre pagine', () => {
    expect(ariaCurrent('/', '/contatti', 'it')).toBeUndefined()
  })

  it('non prende per sottopagina un percorso che ha solo lo stesso prefisso', () => {
    expect(ariaCurrent('/work', '/workshop', 'it')).toBeUndefined()
  })

  it('ripiega sulla lingua di default quando Astro non ne dà una', () => {
    expect(ariaCurrent('/contatti', '/contatti', undefined)).toBe('page')
  })
})

describe('localizedHref', () => {
  it('is identity for the default locale', () => {
    expect(localizedHref('it', '/contatti')).toBe('/contatti')
  })

  it('prefixes a secondary locale', () => {
    expect(localizedHref('en', '/contatti')).toBe('/en/contatti')
  })

  // Astro.currentLocale è undefined su una pagina fuori dal routing i18n.
  it('falls back to the default locale when none is given', () => {
    expect(localizedHref(undefined, '/contatti')).toBe('/contatti')
  })
})
