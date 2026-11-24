import process from 'node:process'

// Sta fuori da site.ts perché `check:placeholders` di officina legge quel file e rifiuta `example.com`.
const PLACEHOLDER_SITE_URL = 'https://example.com'

export function resolveSiteUrl(raw: string | undefined): string {
  return new URL(raw || PLACEHOLDER_SITE_URL).origin
}

export function isStagingSite(url: string): boolean {
  return new URL(url).hostname.endsWith('.vercel.app')
}

export const SITE_URL = resolveSiteUrl(process.env.SITE_URL)
