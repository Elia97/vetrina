import { ActionError } from 'astro:actions'
import { CONTACT_FROM_EMAIL, CONTACT_FROM_NAME, CONTACT_TO_EMAIL } from 'astro:env/server'

import { type ContactRequest, contactAttributes, contactSchema, leadRecoveryRecord } from '@/lib/contact'
import { defineSafeAction } from '@/lib/forms/action-boundary'
import { type BrevoResult, sendTransactionalEmail, upsertContact } from '@/lib/vendor/brevo'

import { useTranslations } from '@/i18n/translate'

import { type ActionContext, admitSubmission } from '@/actions/guards'

import { renderContactAutoreply, renderContactNotification } from '@/emails/contact'

const sender = { email: CONTACT_FROM_EMAIL, name: CONTACT_FROM_NAME }

function sendContactEmails(input: ContactRequest): Promise<[BrevoResult, BrevoResult, BrevoResult]> {
  const notify = renderContactNotification(input)
  const auto = renderContactAutoreply(CONTACT_TO_EMAIL, input.locale)
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
      code: 'BAD_GATEWAY',
      message: useTranslations(input.locale)('forms.action.sendFailed'),
    })
  }
  if (!autoreplied.ok) {
    console.error('[contact] autoreply failed:', autoreplied.error)
  }
  if (!persisted.ok) {
    console.error('[contact] contact upsert failed:', persisted.error)
  }
}

export async function handleContact(input: ContactRequest, context: ActionContext): Promise<{ ok: true }> {
  if (!(await admitSubmission('contact', input, context))) return { ok: true }
  reportContactResults(input, await sendContactEmails(input))
  return { ok: true }
}

export const contact = defineSafeAction('contact', {
  input: contactSchema,
  handler: handleContact,
})
