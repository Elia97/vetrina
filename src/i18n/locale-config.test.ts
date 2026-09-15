import { i18n as stubbedI18n } from '@test/stubs/astro-config-client'
import { describe, expect, it } from 'vitest'

import { DEFAULT_LOCALE, SITE } from '@/lib/site'

import astroConfig from '../../astro.config.mjs'

// astro.config.mjs, SITE.localeTags e test/stubs/astro-config-client.ts portano lo stesso
// elenco di lingue, non possono importarsi a vicenda, e la deriva fra loro è silenziosa.

type LocaleEntry = string | { path: string; codes: string[] }

const i18n = (astroConfig as { i18n?: { defaultLocale: string; locales: LocaleEntry[] } }).i18n

// Le API di Astro parlano di codici; per una voce oggetto è codes[0], con la stessa
// normalizzazione di src/components/head/seo.ts.
function codesOf(locales: readonly LocaleEntry[]): string[] {
  return locales.map((locale) => (typeof locale === 'string' ? locale : (locale.codes[0] ?? locale.path)))
}

describe('locale configuration stays in one shape', () => {
  it('routes at least one locale', () => {
    expect(i18n?.locales?.length).toBeGreaterThan(0)
  })

  it('gives every routed locale a BCP 47 tag', () => {
    const tagged = Object.keys(SITE.localeTags)
    for (const code of codesOf(i18n?.locales ?? [])) {
      expect(tagged, `astro.config.mjs routes "${code}" but SITE.localeTags has no tag for it`).toContain(code)
    }
  })

  it('has no tag for a locale that is not routed', () => {
    const routed = codesOf(i18n?.locales ?? [])
    for (const code of Object.keys(SITE.localeTags)) {
      expect(routed, `SITE.localeTags maps "${code}" but astro.config.mjs does not route it`).toContain(code)
    }
  })

  it('routes its own default locale', () => {
    expect(codesOf(i18n?.locales ?? [])).toContain(i18n?.defaultLocale)
  })

  it('prende la lingua di default da DEFAULT_LOCALE, nella configurazione e nello stub', () => {
    expect(i18n?.defaultLocale).toBe(DEFAULT_LOCALE)
    expect(stubbedI18n.defaultLocale).toBe(DEFAULT_LOCALE)
  })

  it('keeps the unit-test stub mirroring the real config', () => {
    expect(stubbedI18n.defaultLocale).toBe(i18n?.defaultLocale)
    expect(stubbedI18n.locales).toEqual(codesOf(i18n?.locales ?? []))
  })
})
