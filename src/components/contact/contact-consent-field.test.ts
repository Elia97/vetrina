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
    const spoken = label?.cloneNode(true) as Element | undefined
    for (const hidden of spoken?.querySelectorAll('[aria-hidden="true"]') ?? []) hidden.remove()
    const text = spoken?.textContent?.replace(/\s+/g, ' ').trim()

    expect(text).toBe(`${t('contact.consent')} ${t('contact.privacyPolicy')}.`)
    expect(label?.querySelector('a')?.textContent).toBe(t('contact.privacyPolicy'))
  })

  it("allarga l'area di tocco della casella a 24px senza cambiarne il disegno", async () => {
    const checkbox = (await renderToFragment(ContactConsentField)).querySelector('input[name="consent"]')
    const target = checkbox?.parentElement
    const classes = (target?.getAttribute('class') ?? '').split(' ')

    expect(target?.tagName).toBe('LABEL')
    expect(target?.hasAttribute('for')).toBe(false)
    expect(target?.textContent?.trim()).toBe('')
    expect(classes).toEqual(
      expect.arrayContaining(['relative', 'isolate', 'size-4', 'after:absolute', 'after:-inset-1', 'after:-z-10']),
    )
    expect(checkbox?.getAttribute('class')?.split(' ')).toContain('size-4')
  })

  it('non è un contenitore flex, che metterebbe testo, link e punto in colonne affiancate', async () => {
    const classes = ((await renderLabel())?.getAttribute('class') ?? '').split(' ')

    expect(classes).toContain('block')
    expect(classes).not.toContain('flex')
  })
})
