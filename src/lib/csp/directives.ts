// Ogni origine di terze parti va qui, mai in `vercel.json`: una policy che blocca il CMP non
// solleva nessun errore, semplicemente in produzione non rende nessun banner dei cookie.

const SCRIPT_HOSTS = ['https://www.googletagmanager.com', 'https://cdn.iubenda.com', 'https://cs.iubenda.com']

const STATIC_DIRECTIVES = [
  "default-src 'self'",
  // Hashare gli stili renderebbe inerte `'unsafe-inline'` e romperebbe ogni
  // `<style>` con scope che Astro emette.
  "style-src 'self' 'unsafe-inline' https://cdn.iubenda.com",
  "img-src 'self' data: https://www.googletagmanager.com https://*.google-analytics.com https://cdn.iubenda.com",
  "font-src 'self' data:",
  "object-src 'none'",
  "connect-src 'self' https://www.googletagmanager.com https://*.google-analytics.com https://*.analytics.google.com https://*.iubenda.com",
  'frame-src https://www.googletagmanager.com',
  "base-uri 'self'",
  "form-action 'self'",
]

export function buildCspContent(scriptHashes: readonly string[]): string {
  const scriptSrc = ["script-src 'self'", ...scriptHashes.map((hash) => `'${hash}'`), ...SCRIPT_HOSTS]
  return [scriptSrc.join(' '), ...STATIC_DIRECTIVES].join('; ')
}
