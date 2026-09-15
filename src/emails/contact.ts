// Layout a tabella e stili inline perché i client email ignorano i fogli di stile.
// Ogni valore fornito dall'utente passa da escapeHtml prima dell'interpolazione.
import type { ContactRequest } from '@/lib/contact'
import { SITE } from '@/lib/site'

import { useTranslations } from '@/i18n/translate'

const t = useTranslations()

function escapeHtml(value: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }
  /* v8 ignore next -- la regex fa match solo sulle chiavi che la mappa definisce */
  return value.replace(/[&<>"']/g, (c) => map[c] ?? c)
}

function layout(heading: string, body: string): string {
  return `<!doctype html><html lang="${t('email.lang')}"><body style="margin:0;padding:24px;background:#f4f4f5;font-family:Arial,Helvetica,sans-serif;color:#18181b">
  <table role="presentation" style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e4e4e7;border-collapse:collapse">
    <tr><td style="padding:26px 30px">
      <h1 style="margin:0 0 18px;font-size:18px;font-weight:600;letter-spacing:.02em">${escapeHtml(heading)}</h1>
      ${body}
    </td></tr>
  </table></body></html>`
}

function detailRow(label: string, value?: string): string {
  if (!value) return ''
  return `<tr><td style="padding:6px 0;font-size:14px;color:#71717a;width:34%;vertical-align:top">${escapeHtml(label)}</td><td style="padding:6px 0;font-size:14px;color:#18181b">${escapeHtml(value)}</td></tr>`
}

function fullName(request: ContactRequest): string {
  return [request.firstName, request.lastName].filter(Boolean).join(' ').trim()
}

export function renderContactNotification(request: ContactRequest): {
  subject: string
  html: string
} {
  const who = fullName(request) || request.email
  const rows = [
    detailRow(t('email.nameLabel'), fullName(request)),
    detailRow(t('email.emailLabel'), request.email),
    detailRow(t('email.messageLabel'), request.message),
  ].join('')
  const html = layout(
    t('email.notificationHeading'),
    `<table role="presentation" style="width:100%;border-collapse:collapse">${rows}</table>`,
  )
  return { subject: `[${SITE.name}] ${t('email.notificationSubject')} — ${who}`, html }
}

export function renderContactAutoreply(contactEmail: string): {
  subject: string
  html: string
} {
  const body = escapeHtml(t('email.autoreplyBody')).replace('{email}', () => escapeHtml(contactEmail))
  const html = layout(
    t('email.autoreplyHeading'),
    `<p style="margin:0;font-size:14px;line-height:1.6;color:#3f3f46">${body}</p>
     <p style="margin:22px 0 0;font-size:13px;color:#71717a;letter-spacing:.08em;text-transform:uppercase">${escapeHtml(SITE.name)}</p>`,
  )
  return { subject: `${t('email.autoreplySubject')} — ${SITE.name}`, html }
}
