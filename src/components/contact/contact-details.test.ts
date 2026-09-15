import { renderToFragment } from '@test/container'
import { describe, expect, it } from 'vitest'

import { COMPANY } from '@/lib/company'

import { it as dictionary } from '@/i18n/strings/it'

import ContactDetails from './contact-details.astro'

const render = () => renderToFragment(ContactDetails)

describe('contact-details.astro', () => {
  it('chiama il numero in E.164 e mostra la forma per chi legge', async () => {
    const phone = (await render()).querySelector('a[href^="tel:"]')

    expect(phone?.getAttribute('href')).toBe(`tel:${COMPANY.phone}`)
    expect(phone?.textContent?.trim()).toBe(COMPANY.phoneDisplay)
  })

  it("pubblica l'email come link mailto", async () => {
    const email = (await render()).querySelector('a[href^="mailto:"]')

    expect(email?.getAttribute('href')).toBe(`mailto:${COMPANY.email}`)
  })

  it('porta la sede in una riga e le etichette dal dizionario', async () => {
    const text = ((await render()).body.textContent ?? '').replace(/\s+/g, ' ')
    const { streetAddress, postalCode, addressLocality, addressRegion } = COMPANY.address

    expect(text).toContain(`${streetAddress}, ${postalCode} ${addressLocality} (${addressRegion})`)
    for (const key of ['contact.detailsTitle', 'contact.phone', 'contact.email', 'contact.address'] as const) {
      expect(text).toContain(dictionary[key])
    }
  })
})
