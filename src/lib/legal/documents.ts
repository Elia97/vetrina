import { PUBLIC_IUBENDA_COOKIE_POLICY_ID } from 'astro:env/client'
import { z } from 'astro/zod'

export type LegalDocKind = 'privacy' | 'cookie-policy'

function policyId(): string {
  const id = PUBLIC_IUBENDA_COOKIE_POLICY_ID ?? ''
  // Le variabili "sensitive" di Vercel arrivano a un pull prebuilt come la stringa letterale
  // [SENSITIVE]; gli id iubenda sono numerici.
  if (id !== '' && !/^\d+$/.test(id)) {
    console.error('[legal] ignoring non-numeric iubenda policy id (misconfigured env?)')
    return ''
  }
  return id
}

/** null quando non è configurato: per un id vuoto iubenda serve una pagina di policy
 *  generica, non un 404. */
export function iubendaHostedUrl(kind: LegalDocKind): string | null {
  const id = policyId()
  if (id === '') return null
  const base = `https://www.iubenda.com/privacy-policy/${id}`
  return kind === 'privacy' ? base : `${base}/cookie-policy`
}

// L'endpoint /no-markup di iubenda restituisce HTML semantico nudo — nessun JS o CSS del widget.
function apiUrl(kind: LegalDocKind, id: string): string {
  return kind === 'privacy'
    ? `https://www.iubenda.com/api/privacy-policy/${id}/no-markup`
    : `https://www.iubenda.com/api/privacy-policy/${id}/cookie-policy/no-markup`
}

const envelopeSchema = z.object({ success: z.literal(true), content: z.string().min(1) })

/** [HARD] Il risultato viene iniettato con `set:html` dentro HTML prerenderizzato: il markup
 *  attivo si toglie qui invece di contare sulla CSP. Non è un sanitizzatore generico. */
export function sanitizeLegalHtml(html: string): string {
  return html
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, '')
    .replace(/<\/?(iframe|object|embed)\b[^>]*>/gi, '')
    .replace(/<img\b[^>]*>/gi, '')
    .replace(/\son\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/(href|src)\s*=\s*(["']?)\s*javascript:[^"'>\s]*/gi, '$1=$2#')
}

/** [HARD] Configurato significa obbligatorio: in produzione una fetch fallita solleva un
 *  errore invece di spedire come policy la bozza segnaposto "non ancora rivista legalmente". */
export async function getLegalDoc(kind: LegalDocKind): Promise<string | null> {
  const id = policyId()
  if (id === '') return null
  try {
    const res = await fetch(apiUrl(kind, id), { signal: AbortSignal.timeout(10_000) })
    if (!res.ok) throw new Error(`iubenda API ${String(res.status)}`)
    const envelope = envelopeSchema.safeParse(await res.json())
    if (!envelope.success) throw new Error('unexpected API envelope', { cause: envelope.error })
    return sanitizeLegalHtml(envelope.data.content)
  } catch (cause) {
    if (import.meta.env.PROD) {
      throw new Error(
        `[legal] ${kind}: iubenda policy ${id} is configured but could not be fetched — refusing to ship the placeholder draft in place of the real policy`,
        { cause },
      )
    }
    console.error(`[legal] ${kind}: iubenda fetch failed — dev renders the placeholder fallback:`, cause)
    return null
  }
}
