import type { ConsentCategory, GtagFn } from '@/lib/consent/gate'

// `dataLayer` NON è dichiarato qui: quel global lo possiede già
// src/lib/analytics/data-layer.ts come `DataLayerEvent[]`.
declare global {
  interface Window {
    gtag: GtagFn
    _iub?: { csConfiguration?: unknown }
    // Scritto da src/components/head/tracking.astro, letto da src/lib/consent/iubenda.ts.
    __consentConfig?: {
      siteId: string
      cookiePolicyId: string
      lang: string
      cookiePolicyPath: string
      privacyPolicyPath: string
    }
    __consent?: {
      onConsent: (category: ConsentCategory, callback: () => void) => void
    }
    __consentBootstrapped?: boolean
  }
}
