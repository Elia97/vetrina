// vi.mock viene issato in cima a ogni file e non si può registrare da qui: ogni file di test
// chiama da sé vi.mock('@/lib/vendor/brevo', …) e vi.mock('botid/server', …).
import { vi } from 'vitest'

import type { ContactRequest } from '@/lib/contact'
import { HONEYPOT_FIELD } from '@/lib/forms/honeypot'
import type { BrevoResult, SendEmailParams, UpsertContactParams } from '@/lib/vendor/brevo'

export const brevoMock = {
  sendTransactionalEmail: vi.fn<(params: SendEmailParams) => Promise<BrevoResult>>(),
  upsertContact: vi.fn<(params: UpsertContactParams) => Promise<BrevoResult>>(),
}

export const botidMock = { checkBotId: vi.fn<() => Promise<{ isBot: boolean }>>() }

const OK: BrevoResult = { ok: true }
export const KO_ERROR = 'brevo said no'
export const KO: BrevoResult = { ok: false, error: KO_ERROR }

export const CONTACT_INPUT: ContactRequest = {
  [HONEYPOT_FIELD]: '',
  firstName: 'Mario',
  lastName: 'Rossi',
  email: 'mario@example.test',
  message: 'Vorrei un preventivo.',
  consent: true,
}

export const CLIENT = { clientAddress: '203.0.113.10' }

export interface Env {
  prod?: boolean
  botidEnforce?: boolean
}

// Un grafo di moduli fresco azzera anche la finestra scorrevole: lo stato a livello di modulo in
// src/lib/forms/rate-limit.ts.
export async function importActions(env: Env = {}) {
  vi.stubEnv('PROD', env.prod ?? false)
  vi.stubEnv('BOTID_ENFORCE', env.botidEnforce ? 'true' : 'false')
  vi.resetModules()
  return import('@/actions')
}

interface BrevoAnswers {
  notify?: BrevoResult
  autoreply?: BrevoResult
  upsert?: BrevoResult
}

// src/actions/index.ts lancia i tre invii dentro un solo Promise.all, quindi le risposte si
// smistano sul tag e non sull'ordine di chiamata.
export function brevoAnswers({ notify = OK, autoreply = OK, upsert = OK }: BrevoAnswers = {}) {
  brevoMock.sendTransactionalEmail.mockImplementation((params) =>
    Promise.resolve(params.tags?.includes('autoreply') ? autoreply : notify),
  )
  brevoMock.upsertContact.mockResolvedValue(upsert)
}

export function resetActionMocks() {
  vi.clearAllMocks()
  brevoAnswers()
  botidMock.checkBotId.mockResolvedValue({ isBot: false })
}

export function restoreActionEnv() {
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
  vi.resetModules()
}

export interface ThrownActionError extends Error {
  type: string
  code: string
}

// vi.resetModules() ricrea `astro:actions`, quindi `instanceof ActionError` non corrisponde
// mai alla classe che l'handler ha sollevato: si verifica sulla forma serializzata.
function isActionError(error: unknown): error is ThrownActionError {
  return error instanceof Error && 'type' in error && error.type === 'AstroActionError' && 'code' in error
}

export async function rejectionOf(promise: Promise<unknown>): Promise<ThrownActionError> {
  try {
    await promise
  } catch (error) {
    if (isActionError(error)) return error
    throw error
  }
  throw new Error('expected an ActionError, the action resolved instead')
}

export const spyOnConsoleError = () => vi.spyOn(console, 'error').mockImplementation(() => {})
export const spyOnConsoleWarn = () => vi.spyOn(console, 'warn').mockImplementation(() => {})
