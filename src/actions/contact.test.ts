import {
  brevoAnswers,
  brevoMock,
  CLIENT,
  CONTACT_INPUT,
  importContactAction,
  KO,
  KO_ERROR,
  rejectionOf,
  resetActionMocks,
  restoreActionEnv,
  spyOnConsoleError,
} from '@test/helpers/actions'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { SITE } from '@/lib/site'

import { it as dictionary } from '@/i18n/strings/it'
import { useTranslations } from '@/i18n/translate'

vi.mock('@/lib/vendor/brevo', () => brevoMock)
vi.mock('botid/server', () => ({ checkBotId: vi.fn() }))
vi.mock('astro:config/client', () => import('@test/helpers/second-locale').then((m) => m.twoLocaleConfig))
vi.mock('@/i18n/ui', async (importOriginal) => {
  const { withSecondLocaleDictionary } = await import('@test/helpers/second-locale')
  return withSecondLocaleDictionary(await importOriginal())
})

beforeEach(resetActionMocks)
afterEach(restoreActionEnv)

describe('contact handler', () => {
  it('notifies the owner, answers the sender and upserts the contact', async () => {
    const { handleContact } = await importContactAction()

    await expect(handleContact(CONTACT_INPUT, CLIENT)).resolves.toEqual({ ok: true })

    expect(brevoMock.sendTransactionalEmail).toHaveBeenCalledTimes(2)
    expect(brevoMock.upsertContact).toHaveBeenCalledTimes(1)
  })

  it('replies to the sender, so answering the notification reaches them', async () => {
    const { handleContact } = await importContactAction()

    await handleContact(CONTACT_INPUT, CLIENT)

    const notification = brevoMock.sendTransactionalEmail.mock.calls.find((call) => call[0].tags?.includes('contact'))
    expect(notification?.[0].replyTo).toEqual({ email: CONTACT_INPUT.email, name: 'Mario Rossi' })
  })

  it('fails loud when the owner notification fails — the lead would be lost', async () => {
    const consoleError = spyOnConsoleError()
    brevoAnswers({ notify: KO })
    const { handleContact } = await importContactAction()

    const error = await rejectionOf(handleContact(CONTACT_INPUT, CLIENT))

    expect(error.code).toBe('INTERNAL_SERVER_ERROR')
    expect(error.message).toBe(dictionary['forms.action.sendFailed'])
    expect(consoleError).toHaveBeenCalledWith('[contact] notification failed:', KO_ERROR)
  })

  it('swallows an autoreply failure', async () => {
    const consoleError = spyOnConsoleError()
    brevoAnswers({ autoreply: KO })
    const { handleContact } = await importContactAction()

    await expect(handleContact(CONTACT_INPUT, CLIENT)).resolves.toEqual({ ok: true })
    expect(consoleError).toHaveBeenCalledWith('[contact] autoreply failed:', KO_ERROR)
  })

  it('swallows a CRM upsert failure', async () => {
    const consoleError = spyOnConsoleError()
    brevoAnswers({ upsert: KO })
    const { handleContact } = await importContactAction()

    await expect(handleContact(CONTACT_INPUT, CLIENT)).resolves.toEqual({ ok: true })
    expect(consoleError).toHaveBeenCalledWith('[contact] contact upsert failed:', KO_ERROR)
  })
})

describe('la lingua del payload', () => {
  it('risponde a chi scrive nella sua lingua, e avvisa il titolare in quella di default', async () => {
    const { handleContact } = await importContactAction()

    await handleContact({ ...CONTACT_INPUT, locale: 'en' }, CLIENT)

    const subjectOf = (tag: string) =>
      brevoMock.sendTransactionalEmail.mock.calls.find((call) => call[0].tags?.includes(tag))?.[0].subject
    expect(subjectOf('autoreply')).toBe(`${useTranslations('en')('email.autoreplySubject')} — ${SITE.name}`)
    expect(subjectOf('contact')).toBe(`[${SITE.name}] ${dictionary['email.notificationSubject']} — Mario Rossi`)
  })

  it('riporta un invio fallito nella lingua del payload', async () => {
    spyOnConsoleError()
    brevoAnswers({ notify: KO })
    const { handleContact } = await importContactAction()

    const error = await rejectionOf(handleContact({ ...CONTACT_INPUT, locale: 'en' }, CLIENT))

    expect(error.message).toBe(useTranslations('en')('forms.action.sendFailed'))
  })
})

describe('lead recovery', () => {
  it('quando la notifica fallisce registra chi ha scritto e la lunghezza del messaggio, mai il testo', async () => {
    const consoleError = spyOnConsoleError()
    brevoAnswers({ notify: KO })
    const { handleContact } = await importContactAction()

    await rejectionOf(handleContact(CONTACT_INPUT, CLIENT))

    const recovery = consoleError.mock.calls.find((call) => call[0] === '[contact] lead-recovery')
    expect(recovery).toBeDefined()
    const record = JSON.parse(String(recovery?.[1]))
    expect(record).toEqual({
      firstName: CONTACT_INPUT.firstName,
      lastName: CONTACT_INPUT.lastName,
      email: CONTACT_INPUT.email,
      locale: CONTACT_INPUT.locale,
      messageLength: CONTACT_INPUT.message.length,
    })
    expect(record).not.toHaveProperty('message')
  })
})

describe('reply-to without a name', () => {
  // Un nome visualizzato vuoto in un'intestazione reply-to si rende come `<>` in certi client di posta.
  it('sends a bare address when the submission carries no name', async () => {
    brevoAnswers({})
    const { handleContact } = await importContactAction()

    await handleContact({ ...CONTACT_INPUT, firstName: '', lastName: '' }, CLIENT)

    const notification = brevoMock.sendTransactionalEmail.mock.calls.find((call) => call[0].tags?.includes('contact'))
    expect(notification?.[0].replyTo).toEqual({ email: CONTACT_INPUT.email })
  })
})
