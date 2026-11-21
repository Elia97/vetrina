import { type FetchMock, okResponse, stubResolvedFetch, stubUncalledFetch } from '@test/helpers/fetch'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { SendEmailParams } from '@/lib/vendor/brevo'

const OPS = { email: 'ops@example.test', name: 'Ops' }

function emailTo(...to: SendEmailParams['to']): SendEmailParams {
  return { to, sender: { email: 'no-reply@example.test' }, subject: 'Subject', htmlContent: '<p>hi</p>' }
}

async function importBrevo(siteUrl: string, recipients?: string) {
  vi.stubEnv('SITE_URL', siteUrl)
  vi.stubEnv('BREVO_API_KEY', 'secret-key')
  if (recipients !== undefined) vi.stubEnv('STAGING_EMAIL_RECIPIENTS', recipients)
  vi.resetModules()
  return import('@/lib/vendor/brevo')
}

const importStagingBrevo = (recipients?: string) => importBrevo('https://oguns.vercel.app', recipients)

function sentRecipients(fetchMock: FetchMock): unknown {
  const body = fetchMock.mock.calls[0]?.[1]?.body
  return typeof body === 'string' ? (JSON.parse(body) as { to: unknown }).to : undefined
}

function silenceWarnings() {
  return vi.spyOn(console, 'warn').mockImplementation(() => undefined)
}

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('sendTransactionalEmail on a staging site', () => {
  it('sends to an address on the staging list', async () => {
    const brevo = await importStagingBrevo('ops@example.test')
    const fetchMock = stubResolvedFetch(okResponse())

    const result = await brevo.sendTransactionalEmail(emailTo(OPS))

    expect(result).toEqual({ ok: true })
    expect(sentRecipients(fetchMock)).toEqual([OPS])
  })

  it('sends to any address of a listed domain, with or without the @, ignoring case', async () => {
    const brevo = await importStagingBrevo('@agency.test, Example.TEST')
    const fetchMock = stubResolvedFetch(okResponse())

    await brevo.sendTransactionalEmail(emailTo({ email: 'Anna@Agency.test' }, OPS))

    expect(sentRecipients(fetchMock)).toEqual([{ email: 'Anna@Agency.test' }, OPS])
  })

  it('drops the recipients outside the list, without logging them, and sends to the rest', async () => {
    const brevo = await importStagingBrevo('ops@example.test')
    const fetchMock = stubResolvedFetch(okResponse())
    const warn = silenceWarnings()

    await brevo.sendTransactionalEmail(emailTo(OPS, { email: 'visitor@other.test' }))

    expect(sentRecipients(fetchMock)).toEqual([OPS])
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('[brevo]'))
    expect(warn.mock.calls.flat().join(' ')).not.toContain('visitor@other.test')
  })

  it.each([
    ['no recipient is on the list', '@agency.test'],
    ['the list is unset', undefined],
  ])('skips the send without failing when %s', async (_case, recipients) => {
    const brevo = await importStagingBrevo(recipients)
    const fetchMock = stubUncalledFetch()
    silenceWarnings()

    const result = await brevo.sendTransactionalEmail(emailTo(OPS))

    expect(result).toEqual({ ok: true, skipped: true })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('sends to anyone once the site is on its own domain', async () => {
    const brevo = await importBrevo('https://oguns.example')
    const fetchMock = stubResolvedFetch(okResponse())

    await brevo.sendTransactionalEmail(emailTo({ email: 'visitor@other.test' }))

    expect(sentRecipients(fetchMock)).toEqual([{ email: 'visitor@other.test' }])
  })
})

describe('upsertContact on a staging site', () => {
  it('never writes to the contact list, even for a listed address', async () => {
    const brevo = await importStagingBrevo('visitor@example.test')
    const fetchMock = stubUncalledFetch()
    const warn = silenceWarnings()

    const result = await brevo.upsertContact({ email: 'visitor@example.test' })

    expect(result).toEqual({ ok: true, skipped: true })
    expect(fetchMock).not.toHaveBeenCalled()
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('[brevo]'))
  })
})
