import { renderToFragment } from '@test/container'
import { twoLocaleManifest } from '@test/helpers/second-locale'
import { describe, expect, it, vi } from 'vitest'

import ContactForm from '@/components/contact/contact-form.astro'
import ContactFormFields from '@/components/contact/contact-form-fields.astro'

import { contactSchema } from '@/lib/contact'
import { HONEYPOT_FIELD, isHoneypotFilled } from '@/lib/forms/honeypot'
import { DEFAULT_LOCALE } from '@/lib/site'

import { it as dictionary } from '@/i18n/strings/it'

import { fieldErrorId } from './field-errors'

vi.mock('astro:config/client', () => import('@test/helpers/second-locale').then((m) => m.twoLocaleConfig))

// Uno slot mancante o rinominato rispetto allo schema compila benissimo e degrada in silenzio
// l'errore di campo a un messaggio a livello di form.
const WITHOUT_SLOT: readonly string[] = [HONEYPOT_FIELD, 'locale']

const [schema] = contactSchema.options
const expectedFields = Object.keys(schema.shape).filter((field) => !WITHOUT_SLOT.includes(field))

describe('contact form markup contract', () => {
  it('covers every schema field with a slot, and adds none of its own', async () => {
    const document = await renderToFragment(ContactFormFields)
    const slots = [...document.querySelectorAll('[data-field-error]')].map((el) => el.getAttribute('data-field-error'))
    expect(slots.sort()).toEqual([...expectedFields].sort())
  })

  it('points each control at its own slot through aria-describedby', async () => {
    const document = await renderToFragment(ContactFormFields)
    for (const field of expectedFields) {
      const control = document.querySelector(`[name="${field}"]`)
      expect(control, `no control named ${field}`).not.toBeNull()
      expect(control?.getAttribute('aria-describedby')).toBe(fieldErrorId(field))
    }
  })

  it('gives every slot the id its control references', async () => {
    const document = await renderToFragment(ContactFormFields)
    for (const field of expectedFields) {
      expect(document.querySelector(`#${fieldErrorId(field)}`)?.getAttribute('data-field-error')).toBe(field)
    }
  })

  it('renders the honeypot without a slot to give it away', async () => {
    const document = await renderToFragment(ContactFormFields)
    expect(document.querySelector(`[name="${HONEYPOT_FIELD}"]`)).not.toBeNull()
    expect(document.querySelector(`[data-field-error="${HONEYPOT_FIELD}"]`)).toBeNull()
  })
})

const AUTOFILL_HINTS = /web|site|url|home|mail|name|phone|tel|address|company|org|city|zip|postal|country/i

describe('il campo trappola di contact-form-fields.astro', () => {
  it("porta un nome che l'autocompilazione non riconosce", () => {
    expect(HONEYPOT_FIELD).not.toMatch(AUTOFILL_HINTS)
  })

  it('resta in sola lettura, perché Edge e Chrome ignorano autocomplete off ma non riempiono un campo readonly', async () => {
    const trap = (await renderToFragment(ContactFormFields)).querySelector(`[name="${HONEYPOT_FIELD}"]`)

    expect(trap?.getAttribute('type')).toBe('text')
    expect(trap?.hasAttribute('readonly')).toBe(true)
    expect(trap?.hasAttribute('disabled')).toBe(false)
    expect(trap?.getAttribute('autocomplete')).toBe('off')
    expect(trap?.getAttribute('tabindex')).toBe('-1')
  })

  it('scarta un bot che riempie tutti i campi testuali', async () => {
    const document = await renderToFragment(ContactFormFields)
    const controls = document.querySelectorAll('input[type="text"], input[type="email"], textarea')
    const typed = Object.fromEntries(
      [...controls].map((control) => [
        control.getAttribute('name'),
        control.getAttribute('type') === 'email' ? 'bot@example.com' : 'spam',
      ]),
    )

    const parsed = contactSchema.safeParse({ ...typed, locale: DEFAULT_LOCALE, consent: true })

    expect(parsed.success).toBe(true)
    if (parsed.success) expect(isHoneypotFilled(parsed.data)).toBe(true)
  })
})

const contactForm = async () => (await renderToFragment(ContactForm)).querySelector('form[data-contact-form]')

describe('il contratto di invio di contact-form.astro', () => {
  it('invia in POST e senza action, così i campi non finiscono mai nella query string', async () => {
    const form = await contactForm()

    expect(form?.getAttribute('method')).toBe('post')
    expect(form?.hasAttribute('action')).toBe(false)
  })

  it('consegna il pulsante di invio disabilitato, finché non lo abilita il binder', async () => {
    const form = await contactForm()

    expect(form?.querySelector('button[type="submit"]')?.hasAttribute('disabled')).toBe(true)
  })

  it("porta la lingua della pagina, che l'azione non può leggere dalla sua richiesta", async () => {
    const document = await renderToFragment(
      ContactForm,
      { request: new Request('https://example.com/en/contact') },
      twoLocaleManifest,
    )

    expect(document.querySelector('form[data-contact-form]')?.getAttribute('data-locale')).toBe('en')
  })

  it('senza JavaScript rimanda ai recapiti, con il testo del dizionario', async () => {
    const form = await contactForm()

    expect(form?.querySelector('noscript')?.textContent).toContain(dictionary['contact.noscript'])
  })
})
