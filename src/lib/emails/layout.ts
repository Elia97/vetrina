// Layout a tabella e stili inline perché i client email ignorano i fogli di stile.
import { useTranslations } from '@/i18n/translate'

const t = useTranslations()

export function escapeHtml(value: string): string {
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

// body entra senza escape: chi lo compone passa da escapeHtml ogni valore dell'utente.
export function layout(heading: string, body: string): string {
  return `<!doctype html><html lang="${t('email.lang')}"><body style="margin:0;padding:24px;background:#f4f4f5;font-family:Arial,Helvetica,sans-serif;color:#18181b">
  <table role="presentation" style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e4e4e7;border-collapse:collapse">
    <tr><td style="padding:26px 30px">
      <h1 style="margin:0 0 18px;font-size:18px;font-weight:600;letter-spacing:.02em">${escapeHtml(heading)}</h1>
      ${body}
    </td></tr>
  </table></body></html>`
}

export function detailRow(label: string, value?: string): string {
  if (!value) return ''
  return `<tr><td style="padding:6px 0;font-size:14px;color:#71717a;width:34%;vertical-align:top">${escapeHtml(label)}</td><td style="padding:6px 0;font-size:14px;color:#18181b">${escapeHtml(value)}</td></tr>`
}
