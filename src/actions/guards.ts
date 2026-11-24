import { ActionError } from 'astro:actions'
import { BOTID_ENFORCE } from 'astro:env/server'
import { checkBotId } from 'botid/server'

import { type HONEYPOT_FIELD, isHoneypotFilled } from '@/lib/forms/honeypot'
import { rateLimit } from '@/lib/forms/rate-limit'

import { useTranslations } from '@/i18n/translate'

export interface ActionContext {
  clientAddress: string
}

type GuardedInput = Record<typeof HONEYPOT_FIELD, string> & { locale: string }

function droppedByHoneypot(scope: string, input: GuardedInput): boolean {
  if (!isHoneypotFilled(input)) return false
  console.warn(`[${scope}] honeypot filled — submission dropped`)
  return true
}

function assertNotRateLimited(scope: string, clientAddress: string, locale: string): void {
  if (rateLimit(`${scope}:${clientAddress}`)) return
  throw new ActionError({
    code: 'TOO_MANY_REQUESTS',
    message: useTranslations(locale)('forms.action.tooManyRequests'),
  })
}

// checkBotId() legge la richiesta dal contesto di Vercel, quindi non prende argomenti —
// e fuori da Vercel la sfida non gira mai, da cui il gate su PROD.
async function detectBot(scope: string): Promise<boolean> {
  if (!import.meta.env.PROD) return false
  try {
    const { isBot } = await checkBotId()
    return isBot
  } catch (error) {
    console.error(`[${scope}] bot check failed:`, error)
    return false
  }
}

async function assertNotBot(scope: string, locale: string): Promise<void> {
  if (!(await detectBot(scope))) return
  if (!BOTID_ENFORCE) {
    console.warn(`[${scope}] bot detected — observe mode, submission allowed (BOTID_ENFORCE=false)`)
    return
  }
  console.warn(`[${scope}] bot detected — submission rejected`)
  throw new ActionError({
    code: 'FORBIDDEN',
    message: useTranslations(locale)('forms.action.securityCheckFailed'),
  })
}

export async function admitSubmission(scope: string, input: GuardedInput, context: ActionContext): Promise<boolean> {
  if (droppedByHoneypot(scope, input)) return false
  assertNotRateLimited(scope, context.clientAddress, input.locale)
  await assertNotBot(scope, input.locale)
  return true
}
