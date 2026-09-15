import { renderToFragment } from '@test/container'
import { twoLocaleManifest } from '@test/helpers/second-locale'
import { describe, expect, it, vi } from 'vitest'

import LanguageSwitcher from './language-switcher.astro'

vi.mock('astro:config/client', () => import('@test/helpers/second-locale').then((m) => m.twoLocaleConfig))
vi.mock('@/i18n/segments-by-locale', () => import('@test/helpers/second-locale').then((m) => m.translatedSegments))

function render(url: string, props: { locales?: readonly string[] } = {}) {
  return renderToFragment(LanguageSwitcher, { request: new Request(url), props }, twoLocaleManifest)
}

describe('language-switcher.astro', () => {
  it("da una pagina italiana marca la lingua corrente e porta all'inglese sul segmento tradotto", async () => {
    const document = await render('https://example.com/contatti')

    expect(document.querySelector('[aria-current="true"]')?.textContent?.trim()).toBe('Italiano')
    const link = document.querySelector('nav a')
    expect(link?.textContent?.trim()).toBe('English')
    expect(link?.getAttribute('href')).toBe('/en/contact')
    expect(link?.getAttribute('hreflang')).toBe('en')
    expect(link?.getAttribute('lang')).toBe('en')
  })

  it("da una pagina inglese marca l'inglese e porta alla pagina italiana", async () => {
    const document = await render('https://example.com/en/contact')

    expect(document.querySelector('[aria-current="true"]')?.textContent?.trim()).toBe('English')
    const link = document.querySelector('nav a')
    expect(link?.getAttribute('href')).toBe('/contatti')
    expect(link?.getAttribute('hreflang')).toBe('it-IT')
  })

  it('non rende niente su una pagina che esiste in una lingua sola', async () => {
    const document = await render('https://example.com/privacy', { locales: ['it'] })

    expect(document.body.innerHTML.trim()).toBe('')
  })
})
