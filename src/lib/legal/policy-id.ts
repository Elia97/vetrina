import { PUBLIC_IUBENDA_COOKIE_POLICY_ID, PUBLIC_IUBENDA_COOKIE_POLICY_IDS } from 'astro:env/client'

import { DEFAULT_LOCALE } from '@/lib/site'

function translatedPolicyId(locale: string): string {
  for (const pair of (PUBLIC_IUBENDA_COOKIE_POLICY_IDS ?? '').split(',')) {
    const separator = pair.indexOf(':')
    if (separator !== -1 && pair.slice(0, separator).trim() === locale) return pair.slice(separator + 1).trim()
  }
  return ''
}

export function iubendaPolicyId(locale: string = DEFAULT_LOCALE): string {
  const id = locale === DEFAULT_LOCALE ? (PUBLIC_IUBENDA_COOKIE_POLICY_ID ?? '') : translatedPolicyId(locale)
  // Le variabili "sensitive" di Vercel arrivano a un pull prebuilt come la stringa letterale
  // [SENSITIVE]; gli id iubenda sono numerici.
  if (id !== '' && !/^\d+$/.test(id)) {
    console.error(`[legal] ignoring non-numeric iubenda policy id for "${locale}" (misconfigured env?)`)
    return ''
  }
  return id
}
