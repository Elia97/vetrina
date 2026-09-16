import { type ConsentGate, type ConsentPreference, consentGate } from '@/lib/consent/gate'

export interface IubendaCsCallback {
  onPreferenceExpressed: (pref: ConsentPreference) => void
  onConsentRead: (pref: ConsentPreference) => void
}

export interface IubendaCsConfiguration {
  siteId: number
  cookiePolicyId: number
  lang: string
  consentOnContinuedBrowsing: boolean
  perPurposeConsent: boolean
  floatingPreferencesButtonDisplay: boolean
  cookiePolicyUrl?: string
  privacyPolicyUrl?: string
  cookiePolicyInOtherWindow: boolean
  privacyPolicyInOtherWindow: boolean
  callback: IubendaCsCallback
}

/** [HARD] Con `floatingPreferencesButtonDisplay` a false, il
 *  `.iubenda-cs-preferences-link` del footer è l'unico modo rimasto per revocare il consenso. */
export function buildCsConfiguration(opts: {
  siteId: string
  cookiePolicyId: string
  lang: string
  cookiePolicyUrl: string
  privacyPolicyUrl: string
  onPreference: (pref: ConsentPreference) => void
}): IubendaCsConfiguration {
  return {
    siteId: Number(opts.siteId),
    cookiePolicyId: Number(opts.cookiePolicyId),
    lang: opts.lang,
    consentOnContinuedBrowsing: false,
    perPurposeConsent: true,
    floatingPreferencesButtonDisplay: false,
    // Senza questi due URL la CMP apre le policy in un iframe verso www.iubenda.com, che
    // `frame-src` non permette: il pannello resta vuoto e solo la console lo dice.
    ...(opts.cookiePolicyUrl === '' ? {} : { cookiePolicyUrl: opts.cookiePolicyUrl }),
    ...(opts.privacyPolicyUrl === '' ? {} : { privacyPolicyUrl: opts.privacyPolicyUrl }),
    cookiePolicyInOtherWindow: true,
    privacyPolicyInOtherWindow: true,
    callback: {
      // onConsentRead porta la preferenza salvata quando si torna sul sito;
      // onPreferenceExpressed scatta solo su una scelta nuova.
      onPreferenceExpressed: opts.onPreference,
      onConsentRead: opts.onPreference,
    },
  }
}

export interface BootstrapDeps {
  win: Window & typeof globalThis
  doc: Document
  gate: ConsentGate
  loadScript: (src: string) => void
}

const IUBENDA_CS_SRC = 'https://cdn.iubenda.com/cs/iubenda_cs.js'

const pageUrl = (win: Window & typeof globalThis, path: string): string =>
  path === '' ? '' : new URL(path, win.location.origin).toString()

export function bootstrapIubenda(deps?: Partial<BootstrapDeps>): void {
  const win = deps?.win ?? window
  const doc = deps?.doc ?? document
  const gate = deps?.gate ?? consentGate
  const loadScript =
    deps?.loadScript ??
    ((src: string): void => {
      const script = doc.createElement('script')
      script.async = true
      script.src = src
      doc.head.appendChild(script)
    })

  if (win.__consentBootstrapped === true) return
  win.__consentBootstrapped = true

  const cfg = win.__consentConfig
  if (cfg === undefined || cfg.siteId === '') return

  win.__consent = { onConsent: gate.onConsent }

  win._iub = win._iub ?? {}
  win._iub.csConfiguration = buildCsConfiguration({
    siteId: cfg.siteId,
    cookiePolicyId: cfg.cookiePolicyId,
    lang: cfg.lang,
    cookiePolicyUrl: pageUrl(win, cfg.cookiePolicyPath),
    privacyPolicyUrl: pageUrl(win, cfg.privacyPolicyPath),
    onPreference: (pref) => {
      gate.applyPreference(pref)
    },
  })

  loadScript(IUBENDA_CS_SRC)
}
