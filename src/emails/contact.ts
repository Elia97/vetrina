import type { ContactRequest } from '@/lib/contact'
import { detailRow, escapeHtml, layout } from '@/lib/emails/layout'
import { SITE } from '@/lib/site'

import { localeName, pageLocales } from '@/i18n/locales'
import { useTranslations } from '@/i18n/translate'

function fullName(request: ContactRequest): string {
  return [request.firstName, request.lastName].filter(Boolean).join(' ').trim()
}

export function renderContactNotification(request: ContactRequest): {
  subject: string
  html: string
} {
  const t = useTranslations()
  const who = fullName(request) || request.email
  const rows = [
    detailRow(t('email.nameLabel'), fullName(request)),
    detailRow(t('email.emailLabel'), request.email),
    detailRow(t('email.localeLabel'), pageLocales().length > 1 ? localeName(request.locale) : ''),
    detailRow(t('email.messageLabel'), request.message),
  ].join('')
  const html = layout(
    t('email.notificationHeading'),
    `<table role="presentation" style="width:100%;border-collapse:collapse">${rows}</table>`,
  )
  return { subject: `[${SITE.name}] ${t('email.notificationSubject')} — ${who}`, html }
}

export function renderContactAutoreply(
  contactEmail: string,
  locale: string,
): {
  subject: string
  html: string
} {
  const t = useTranslations(locale)
  const body = escapeHtml(t('email.autoreplyBody')).replace('{email}', () => escapeHtml(contactEmail))
  const html = layout(
    t('email.autoreplyHeading'),
    `<p style="margin:0;font-size:14px;line-height:1.6;color:#3f3f46">${body}</p>
     <p style="margin:22px 0 0;font-size:13px;color:#71717a;letter-spacing:.08em;text-transform:uppercase">${escapeHtml(SITE.name)}</p>`,
    locale,
  )
  return { subject: `${t('email.autoreplySubject')} — ${SITE.name}`, html }
}
