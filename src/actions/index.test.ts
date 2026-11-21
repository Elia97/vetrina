import {
  botidMock,
  brevoAnswers,
  brevoMock,
  CLIENT,
  CONTACT_INPUT,
  importActionRegistry,
  KO,
  registeredHandler,
  rejectionOf,
  resetActionMocks,
  restoreActionEnv,
  spyOnConsoleError,
} from '@test/helpers/actions'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { it as dictionary } from '@/i18n/strings/it'
import { useTranslations } from '@/i18n/translate'

vi.mock('@/lib/vendor/brevo', () => brevoMock)
vi.mock('botid/server', () => botidMock)
vi.mock('astro:config/client', () => import('@test/helpers/second-locale').then((m) => m.twoLocaleConfig))
vi.mock('@/i18n/ui', async (importOriginal) => {
  const { withSecondLocaleDictionary } = await import('@test/helpers/second-locale')
  return withSecondLocaleDictionary(await importOriginal())
})

const INTERNAL = new Error('DATABASE_URL unset — the database is required to sign in')

beforeEach(resetActionMocks)
afterEach(restoreActionEnv)

describe('server', () => {
  it("registra l'azione di contatto", async () => {
    const { contact } = await import('@/actions/contact')
    const { server } = await import('@/actions')

    expect(server.contact).toBe(contact)
  })
})

describe("il confine d'errore delle azioni registrate", () => {
  it("registra con lo stack l'errore sfuggito, e al browser manda solo il messaggio generico", async () => {
    const consoleError = spyOnConsoleError()
    brevoMock.sendTransactionalEmail.mockRejectedValue(INTERNAL)
    const { server } = await importActionRegistry()

    const error = await rejectionOf(registeredHandler(server.contact)(CONTACT_INPUT, CLIENT))

    expect(error.code).toBe('INTERNAL_SERVER_ERROR')
    expect(error.message).toBe(dictionary['forms.action.unexpected'])
    expect(consoleError).toHaveBeenCalledWith('[contact] unhandled error:', INTERNAL)
  })

  it('manda il messaggio generico nella lingua del payload', async () => {
    spyOnConsoleError()
    brevoMock.sendTransactionalEmail.mockRejectedValue(INTERNAL)
    const { server } = await importActionRegistry()

    const error = await rejectionOf(registeredHandler(server.contact)({ ...CONTACT_INPUT, locale: 'en' }, CLIENT))

    expect(error.message).toBe(useTranslations('en')('forms.action.unexpected'))
  })

  it('lascia passare invariato un ActionError sollevato di proposito, senza registrarlo come sfuggito', async () => {
    const consoleError = spyOnConsoleError()
    const { server } = await importActionRegistry()
    const handler = registeredHandler(server.contact)
    for (let i = 0; i < 5; i++) await handler(CONTACT_INPUT, CLIENT)

    const error = await rejectionOf(handler(CONTACT_INPUT, CLIENT))

    expect(error.code).toBe('TOO_MANY_REQUESTS')
    expect(error.message).toBe(dictionary['forms.action.tooManyRequests'])
    expect(consoleError).not.toHaveBeenCalled()
  })

  it('risponde 502, non 500, al guasto del fornitore già registrato', async () => {
    const consoleError = spyOnConsoleError()
    brevoAnswers({ notify: KO })
    const { server } = await importActionRegistry()

    const error = await rejectionOf(registeredHandler(server.contact)(CONTACT_INPUT, CLIENT))

    expect(error.code).toBe('BAD_GATEWAY')
    expect(error.message).toBe(dictionary['forms.action.sendFailed'])
    expect(consoleError).not.toHaveBeenCalledWith('[contact] unhandled error:', expect.anything())
  })
})
