// Ogni origine di terze parti va qui, mai in `vercel.json`: una policy che blocca il CMP non
// solleva nessun errore, semplicemente in produzione non rende nessun banner dei cookie.

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
    'https://cdn.iubenda.com',
  ],
  'font-src': ["'self'", 'data:'],
  'object-src': ["'none'"],
  'connect-src': [
    "'self'",
    'https://www.googletagmanager.com',
    'https://*.google-analytics.com',
    'https://*.analytics.google.com',
    'https://*.iubenda.com',
  ],
  'frame-src': ['https://www.googletagmanager.com'],
  'base-uri': ["'self'"],
  'form-action': ["'self'"],
}

// Host della Vercel Toolbar, dalla documentazione Vercel `vercel-toolbar/managing-toolbar`.
// `manifest-src`: dietro la protezione del deployment il manifest passa da `vercel.com/sso-api`.
const PREVIEW: Sources = {
  'script-src': ['https://vercel.live'],
  'style-src': ['https://vercel.live'],
  'img-src': ['https://vercel.live', 'https://vercel.com', 'blob:'],
  'font-src': ['https://vercel.live', 'https://assets.vercel.com'],
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
