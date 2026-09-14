import { pushToDataLayer } from '@/lib/analytics/data-layer'
import { type ConsentCategory, onConsent as defaultOnConsent } from '@/lib/consent/gate'

export interface AnalyticsBootstrapDeps {
  win: Window & typeof globalThis
  onConsent: (category: ConsentCategory, callback: () => void) => void
}

function loadGtm(win: Window & typeof globalThis, gtmId: string): void {
  if (win.__analyticsLoaded === true) return
  win.__analyticsLoaded = true

  // GTM legge gtm.start dal dataLayer per cronometrare il container.
  pushToDataLayer({ 'gtm.start': Date.now(), event: 'gtm.js' })

  const script = win.document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtm.js?id=${gtmId}`
  win.document.head.appendChild(script)
}

/** Consent Mode base, non avanzato: la modellazione di Google vuole circa mille eventi al
 *  giorno per lato, che un sito di queste dimensioni non raggiunge. */
export function bootstrapAnalytics(deps?: Partial<AnalyticsBootstrapDeps>): void {
  const win = deps?.win ?? window
  const onConsent = deps?.onConsent ?? defaultOnConsent

  const config = win.__analyticsConfig
  if (config === undefined || config.gtmId === '') return

  onConsent('measurement', () => {
    loadGtm(win, config.gtmId)
  })
}
