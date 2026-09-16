// Ogni origine di terze parti va qui, mai in `vercel.json`: una voce mancante non solleva nessun
// errore. Quale host serve a quale tag: docs/guides/deploy-ops.md § Tracciamento e Consent Mode v2.

type Sources = Record<string, readonly string[]>

const BASE: Sources = {
  'script-src': ["'self'", 'https://www.googletagmanager.com', 'https://cdn.iubenda.com', 'https://cs.iubenda.com'],
  'default-src': ["'self'"],
  'style-src': ["'self'", "'unsafe-inline'", 'https://cdn.iubenda.com'],
  'img-src': [
    "'self'",
    'data:',
    'https://www.googletagmanager.com',
    'https://*.google-analytics.com',
    'https://*.g.doubleclick.net',
    'https://*.google.com',
    'https://cdn.iubenda.com',
  ],
  'font-src': ["'self'", 'data:'],
  'object-src': ["'none'"],
  'connect-src': [
    "'self'",
    'https://www.googletagmanager.com',
    'https://*.google-analytics.com',
    'https://*.analytics.google.com',
    'https://*.g.doubleclick.net',
    'https://*.google.com',
    'https://pagead2.googlesyndication.com',
    'https://*.iubenda.com',
  ],
  'frame-src': ['https://www.googletagmanager.com'],
  'base-uri': ["'self'"],
  'form-action': ["'self'"],
}

// Solo sui preview: Vercel Toolbar (`vercel-toolbar/managing-toolbar`) e Anteprima di GTM (guida CSP
// di Google); `manifest-src` perché la protezione del deployment riscrive il manifest su vercel.com.
const PREVIEW: Sources = {
  'script-src': ['https://vercel.live', 'https://tagmanager.google.com'],
  'style-src': [
    'https://vercel.live',
    'https://www.googletagmanager.com',
    'https://tagmanager.google.com',
    'https://fonts.googleapis.com',
  ],
  'img-src': [
    'https://vercel.live',
    'https://vercel.com',
    'blob:',
    'https://ssl.gstatic.com',
    'https://www.gstatic.com',
  ],
  'font-src': ['https://vercel.live', 'https://assets.vercel.com', 'https://fonts.gstatic.com'],
  'connect-src': ['https://vercel.live', 'wss://ws-us3.pusher.com'],
  'frame-src': ['https://vercel.live'],
  'manifest-src': ["'self'", 'https://vercel.com'],
}

// Vercel imposta `VERCEL_ENV` a `preview` solo sui deploy di preview: in produzione, in CI e in
// locale la variabile non vale `preview`.
export const isPreviewDeploy = (vercelEnv: string | undefined): boolean => vercelEnv === 'preview'

export function buildCspContent(scriptHashes: readonly string[], vercelEnv?: string): string {
  const extra: Sources = isPreviewDeploy(vercelEnv) ? PREVIEW : {}
  const names = [...new Set([...Object.keys(BASE), ...Object.keys(extra)])]
  return names
    .map((name) => {
      const hashes = name === 'script-src' ? scriptHashes.map((hash) => `'${hash}'`) : []
      return [name, ...(BASE[name] ?? []), ...hashes, ...(extra[name] ?? [])].join(' ')
    })
    .join('; ')
}
