import { describe, expect, expectTypeOf, it, vi } from 'vitest'

import { type DomainDictionaries, type UIKey, useTranslations } from '@/i18n/translate'

const account = { it: { 'account.signIn': 'Sign in' } } satisfies DomainDictionaries<'account.signIn'>

describe('useTranslations', () => {
  it('resolves keys for the default locale', () => {
    const t = useTranslations('it')
    expect(t('nav.home')).toBe('Home')
  })

  it('uses the default locale when none is given (static pages outside i18n routing)', () => {
    const t = useTranslations(undefined)
    expect(t('a11y.skipToContent')).toBe('Salta al contenuto')
  })

  it('falls back to the default dictionary for unregistered locales', () => {
    const t = useTranslations('de')
    expect(t('footer.legalHeading')).toBe('Legale')
  })
})

describe('useTranslations con un dominio', () => {
  it('risolve le chiavi del dominio accanto a quelle del sito', () => {
    const t = useTranslations('it', account)

    expect(t('account.signIn')).toBe('Sign in')
    expect(t('nav.home')).toBe('Home')
  })

  it('per una lingua non registrata ripiega sul dizionario di default anche nel dominio', () => {
    expect(useTranslations('de', account)('account.signIn')).toBe('Sign in')
  })
})

// Solo asserzioni di tipo: a runtime vitest le passa senza controllarle, le verifica `pnpm run typecheck`.
describe('i tipi di un dominio', () => {
  it('tipizzano le chiavi del sito e del dominio', () => {
    expectTypeOf(useTranslations('it', account)).parameter(0).toEqualTypeOf<UIKey | 'account.signIn'>()
    // @ts-expect-error
    useTranslations('it', account)('account.signOut')
  })

  it('pretendono un dizionario per ogni lingua registrata', () => {
    // @ts-expect-error
    useTranslations('it', {})
  })

  it('non lasciano ridefinire una chiave del sito', () => {
    // @ts-expect-error
    useTranslations('it', { it: { 'nav.home': 'Home' } })
  })
})

// Una lingua instradata in astro.config.mjs senza un dizionario in ui.ts è una
// configurazione sbagliata che il compilatore non vede.
describe('missing dictionaries', () => {
  it('throws when even the default locale has none registered', async () => {
    vi.resetModules()
    vi.doMock('@/i18n/ui', () => ({ dictionaries: {} }))
    const { useTranslations } = await import('@/i18n/translate')

    expect(() => useTranslations()).toThrow(/No dictionary registered for the default locale/)
  })
})
