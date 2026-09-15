import { ActionError, defineAction } from 'astro:actions'
import { BOTID_ENFORCE, CONTACT_FROM_EMAIL, CONTACT_FROM_NAME, CONTACT_TO_EMAIL } from 'astro:env/server'
import { checkBotId } from 'botid/server'

import { type ContactRequest, contactAttributes, contactSchema, leadRecoveryRecord } from '@/lib/contact'
import { isHoneypotFilled } from '@/lib/forms/honeypot'
import { rateLimit } from '@/lib/forms/rate-limit'
import { type BrevoResult, sendTransactionalEmail, upsertContact } from '@/lib/vendor/brevo'

import { useTranslations } from '@/i18n/translate'

import { renderContactAutoreply, renderContactNotification } from '@/emails/contact'

const t = useTranslations()
const sender = { email: CONTACT_FROM_EMAIL, name: CONTACT_FROM_NAME }

function droppedByHoneypot(input: Parameters<typeof isHoneypotFilled>[0]): boolean {
  if (!isHoneypotFilled(input)) return false
  console.warn('[contact] honeypot filled — submission dropped')
  return true
}

function assertNotRateLimited(clientAddress: string): void {
  if (rateLimit(`contact:${clientAddress}`)) return
  throw new ActionError({
    code: 'TOO_MANY_REQUESTS',
    message: t('forms.action.tooManyRequests'),
  })
}

// checkBotId() legge la richiesta dal contesto di Vercel, quindi non prende argomenti —
// e fuori da Vercel la sfida non gira mai, da cui il gate su PROD.
async function detectBot(): Promise<boolean> {
  if (!import.meta.env.PROD) return false
  try {
    const { isBot } = await checkBotId()
    return isBot
  } catch (error) {
    console.error('[contact] bot check failed:', error)
    return false
  }
}

async function assertNotBot(): Promise<void> {
  if (!(await detectBot())) return
  if (!BOTID_ENFORCE) {
    console.warn('[contact] bot detected — observe mode, submission allowed (BOTID_ENFORCE=false)')
    return
  }
  console.warn('[contact] bot detected — submission rejected')
  throw new ActionError({
    code: 'FORBIDDEN',
    message: t('forms.action.securityCheckFailed'),
  })
}

function sendContactEmails(input: ContactRequest): Promise<[BrevoResult, BrevoResult, BrevoResult]> {
  const notify = renderContactNotification(input)
  const auto = renderContactAutoreply(CONTACT_TO_EMAIL)
  const replyToName = [input.firstName, input.lastName].filter(Boolean).join(' ')

  return Promise.all([
    sendTransactionalEmail({
      to: [{ email: CONTACT_TO_EMAIL, name: CONTACT_FROM_NAME }],
      sender,
      replyTo: replyToName ? { email: input.email, name: replyToName } : { email: input.email },
      subject: notify.subject,
      htmlContent: notify.html,
      tags: ['contact'],
    }),
    sendTransactionalEmail({
      to: [{ email: input.email }],
      sender,
      subject: auto.subject,
      htmlContent: auto.html,
      tags: ['autoreply'],
    }),
    upsertContact({
      email: input.email,
      attributes: contactAttributes(input),
    }),
  ])
}

// [HARD] GDPR: sostituire `leadRecoveryRecord(input)` con `input` vuol dire dichiararlo nell'informativa del progetto.
function reportContactResults(
  input: ContactRequest,
  [notified, autoreplied, persisted]: [BrevoResult, BrevoResult, BrevoResult],
): void {
  if (!notified.ok) {
    console.error('[contact] notification failed:', notified.error)
    console.error('[contact] lead-recovery', JSON.stringify(leadRecoveryRecord(input)))
    throw new ActionError({
      code: 'INTERNAL_SERVER_ERROR',
      message: t('forms.action.sendFailed'),
    })
  }
  if (!autoreplied.ok) {
    console.error('[contact] autoreply failed:', autoreplied.error)
  }
  if (!persisted.ok) {
    console.error('[contact] contact upsert failed:', persisted.error)
  }
}

export interface ActionContext {
  clientAddress: string
}

export async function handleContact(input: ContactRequest, context: ActionContext): Promise<{ ok: true }> {
  if (droppedByHoneypot(input)) return { ok: true }
  assertNotRateLimited(context.clientAddress)
  await assertNotBot()
  reportContactResults(input, await sendContactEmails(input))
  return { ok: true }
}

export const server = {
  contact: defineAction({
    accept: 'json',
    input: contactSchema,
    handler: handleContact,
  }),
}
