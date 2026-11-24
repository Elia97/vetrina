import { getSecret } from 'astro:env/server'

import { isStagingSite, SITE_URL } from '@/lib/site-url'

const BREVO_API = 'https://api.brevo.com/v3'

// [HARD] `fetch` non ha nessun timeout di default, e tre di queste girano in parallelo:
// tienilo ben sotto il `maxDuration` di vercel.json.
const REQUEST_TIMEOUT_MS = 8_000

interface EmailAddress {
  email: string
  name?: string
}

export interface SendEmailParams {
  to: EmailAddress[]
  subject: string
  htmlContent: string
  sender: EmailAddress
  replyTo?: EmailAddress
  tags?: string[]
}

export interface UpsertContactParams {
  email: string
  attributes?: Record<string, string | number | boolean>
  listIds?: number[]
}

export type BrevoResult = { ok: true; skipped?: boolean } | { ok: false; error: string }

const SKIPPED: BrevoResult = { ok: true, skipped: true }

async function brevoFetch(path: string, body: unknown): Promise<BrevoResult> {
  const key = getSecret('BREVO_API_KEY')
  if (!key) {
    if (import.meta.env.PROD) {
      return {
        ok: false,
        error: `BREVO_API_KEY unset in production — refusing to no-op POST ${path}`,
      }
    }
    console.warn(`[brevo] BREVO_API_KEY unset — skipping POST ${path} (dev/no-op)`)
    return SKIPPED
  }
  try {
    const res = await fetch(`${BREVO_API}${path}`, {
      method: 'POST',
      headers: {
        'api-key': key,
        'content-type': 'application/json',
        accept: 'application/json',
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    })
    if (!res.ok) {
      const detail = await res.text().catch(() => '')
      return {
        ok: false,
        error: `Brevo ${path} ${String(res.status)}: ${detail.slice(0, 300)}`,
      }
    }
    return { ok: true }
  } catch (cause) {
    return {
      ok: false,
      error: `Brevo ${path} request failed: ${String(cause)}`,
    }
  }
}

function stagingAllowlist(): string[] {
  return (getSecret('STAGING_EMAIL_RECIPIENTS') ?? '')
    .split(',')
    .map((entry) => entry.trim().toLowerCase().replace(/^@/, ''))
    .filter((entry) => entry !== '')
}

function isAllowedInStaging(email: string, allowlist: readonly string[]): boolean {
  const address = email.toLowerCase()
  const domain = address.slice(address.lastIndexOf('@') + 1)
  return allowlist.some((entry) => entry === address || entry === domain)
}

function stagingRecipients(to: EmailAddress[]): EmailAddress[] {
  if (!isStagingSite(SITE_URL)) return to
  const allowlist = stagingAllowlist()
  const kept = to.filter((recipient) => isAllowedInStaging(recipient.email, allowlist))
  if (kept.length < to.length) {
    console.warn(
      `[brevo] staging site — dropped ${String(to.length - kept.length)} recipient(s) outside STAGING_EMAIL_RECIPIENTS`,
    )
  }
  return kept
}

export async function sendTransactionalEmail(params: SendEmailParams): Promise<BrevoResult> {
  const to = stagingRecipients(params.to)
  if (to.length === 0) return SKIPPED
  return brevoFetch('/smtp/email', {
    sender: params.sender,
    to,
    replyTo: params.replyTo,
    subject: params.subject,
    htmlContent: params.htmlContent,
    tags: params.tags,
  })
}

export async function upsertContact(params: UpsertContactParams): Promise<BrevoResult> {
  if (isStagingSite(SITE_URL)) {
    console.warn('[brevo] staging site — skipping POST /contacts')
    return SKIPPED
  }
  return brevoFetch('/contacts', {
    email: params.email,
    attributes: params.attributes,
    listIds: params.listIds,
    updateEnabled: true,
  })
}
