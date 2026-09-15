import { describe, expect, it } from 'vitest'

import type { ContactRequest } from '@/lib/contact'
import { HONEYPOT_FIELD } from '@/lib/forms/honeypot'
import { SITE } from '@/lib/site'

import { it as dictionary } from '@/i18n/strings/it'

import { renderContactAutoreply, renderContactNotification } from '@/emails/contact'

const baseRequest: ContactRequest = {
  // Fa parte del payload validato, mai dell'email resa: una richiesta che arriva al
  // renderer ha già superato l'esca.
  [HONEYPOT_FIELD]: '',
  firstName: 'Mario',
  lastName: 'Rossi',
  email: 'mario@example.com',
  message: '',
  consent: true,
}

describe('renderContactNotification', () => {
  it('builds the subject with the site name and the sender name', () => {
    const { subject } = renderContactNotification(baseRequest)
    expect(subject).toBe(`[${SITE.name}] ${dictionary['email.notificationSubject']} — Mario Rossi`)
  })

  it('escapes HTML in user-provided fields', () => {
    const { html } = renderContactNotification({
      ...baseRequest,
      message: '<script>alert(1)</script>',
    })
    expect(html).toContain('&lt;script&gt;')
    expect(html).not.toContain('<script>')
  })

  it('falls back to the email when no name is given', () => {
    const { subject } = renderContactNotification({
      ...baseRequest,
      firstName: '',
      lastName: '',
      email: 'noname@example.com',
    })
    expect(subject).toContain('noname@example.com')
  })

  it('omits the row of an empty optional field', () => {
    const { html } = renderContactNotification(baseRequest)
    expect(html).not.toContain(dictionary['email.messageLabel'])
  })

  it('prende lingua, titolo ed etichette dal dizionario', () => {
    const { html } = renderContactNotification({ ...baseRequest, message: 'Hello' })

    expect(html).toContain(`<html lang="${dictionary['email.lang']}">`)
    for (const key of [
      'email.notificationHeading',
      'email.nameLabel',
      'email.emailLabel',
      'email.messageLabel',
    ] as const) {
      expect(html).toContain(dictionary[key])
    }
  })
})

describe('renderContactAutoreply', () => {
  it('tells the visitor where to write for urgent matters', () => {
    const { html } = renderContactAutoreply('info@example.com')
    expect(html).toContain('info@example.com')
  })

  it('signs with the site name', () => {
    const { subject, html } = renderContactAutoreply('info@example.com')
    expect(subject).toContain('<PROJECT_NAME>')
    expect(html).toContain('&lt;PROJECT_NAME&gt;')
  })

  it("prende oggetto, titolo e corpo dal dizionario, con l'indirizzo al posto del segnaposto", () => {
    const { subject, html } = renderContactAutoreply('sales@acme.test')

    expect(subject).toBe(`${dictionary['email.autoreplySubject']} — ${SITE.name}`)
    expect(html).toContain(dictionary['email.autoreplyHeading'])
    expect(html).toContain(dictionary['email.autoreplyBody'].replace('{email}', 'sales@acme.test'))
  })
})
