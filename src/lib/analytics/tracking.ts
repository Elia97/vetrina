import { PUBLIC_GTM_ID, PUBLIC_IUBENDA_COOKIE_POLICY_ID, PUBLIC_IUBENDA_SITE_ID } from 'astro:env/client'

export interface TrackingConfig {
  gtmId: string
  iubendaSiteId: string
  cookiePolicyId: string
}

// Le variabili "sensitive" di Vercel arrivano a un pull prebuilt come la stringa letterale
// [SENSITIVE]: queste si creano Plain, perché la build legge l'ambiente al `vercel pull`.
function numericId(value: string | undefined): string {
  const id = value ?? ''
  return /^\d+$/.test(id) ? id : ''
}

/** null se non ci sono entrambe: senza tag non c'è nessun cookie non essenziale, quindi
 *  nessun banner di consenso è dovuto per legge. */
export function getTrackingConfig(): TrackingConfig | null {
  const gtmId = PUBLIC_GTM_ID ?? ''
  const iubendaSiteId = numericId(PUBLIC_IUBENDA_SITE_ID)
  if (gtmId === '' || iubendaSiteId === '') return null

  return { gtmId, iubendaSiteId, cookiePolicyId: numericId(PUBLIC_IUBENDA_COOKIE_POLICY_ID) }
}
