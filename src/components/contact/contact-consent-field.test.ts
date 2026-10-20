import { renderToFragment } from '@test/container'
import { describe, expect, it } from 'vitest'

import { useTranslations } from '@/i18n/translate'

import ContactConsentField from './contact-consent-field.astro'

const t = useTranslations()

async function renderLabel() {
  return (await renderToFragment(ContactConsentField)).querySelector('label[for="consent"]')
}

describe('contact-consent-field.astro', () => {
  it('si legge come una frase sola, con il link alla privacy in linea e il punto attaccato', async () => {
    const label = await renderLabel()
    const text = label?.textContent?.replace(/\s+/g, ' ').trim()

    expect(text).toBe(`${t('contact.consent')} ${t('contact.privacyPolicy')}.`)
    expect(label?.querySelector('a')?.textContent).toBe(t('contact.privacyPolicy'))
  })

  it('non è un contenitore flex, che metterebbe testo, link e punto in colonne affiancate', async () => {
    const classes = ((await renderLabel())?.getAttribute('class') ?? '').split(' ')

    expect(classes).toContain('block')
    expect(classes).not.toContain('flex')
  })
})
