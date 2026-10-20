import { renderToFragment } from '@test/container'
import { SECOND_LOCALE_DESCRIPTION, twoLocaleManifest } from '@test/helpers/second-locale'
import { describe, expect, it, vi } from 'vitest'

import Homepage from '@/pages/index.astro'

vi.mock('astro:config/client', () => import('@test/helpers/second-locale').then((m) => m.twoLocaleConfig))
vi.mock('@/i18n/ui', async (importOriginal) => {
  const { withSecondLocaleDictionary } = await import('@test/helpers/second-locale')
  return withSecondLocaleDictionary(await importOriginal())
})
vi.mock('@/lib/homepage', () => ({
  getHomepageSections: async () => ({
    hero: { eyebrow: 'Eyebrow', title: 'Title', subtitle: 'Subtitle', buttons: [] },
  }),
}))

describe('la homepage in una seconda lingua', () => {
  it('porta la descrizione del sito nella sua lingua, nella meta description e nel footer', async () => {
    const request = new Request('https://example.com/en')
    const document = await renderToFragment(Homepage, { request }, twoLocaleManifest)

    expect(document.querySelector('meta[name="description"]')?.getAttribute('content')).toBe(SECOND_LOCALE_DESCRIPTION)
    expect(document.querySelector('footer')?.textContent).toContain(SECOND_LOCALE_DESCRIPTION)
  })
})
