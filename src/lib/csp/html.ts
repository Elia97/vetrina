import { createHash } from 'node:crypto'

const SCRIPT_RE = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi
// `(?<![-\w])` e non `\b`: `\bsrc` prende anche `data-src`, il cui script perderebbe il
// proprio hash e verrebbe bloccato.
const HAS_SRC = /(?<![-\w])src\s*=/i
// `script-src` non governa i blocchi di dati, quindi non serve loro nessun hash.
const DATA_TYPE = /(?<![-\w])type\s*=\s*["']?application\/(?:ld\+json|json)["']?/i

export function collectInlineScriptHashes(html: string): string[] {
  const hashes = new Set<string>()
  // `replace` e non `matchAll`: la sua callback tipizza i gruppi come `string`, quindi i due
  // ripieghi `?? ''` irraggiungibili che il gate di copertura segnalerebbe non esistono.
  html.replace(SCRIPT_RE, (_tag: string, attrs: string, body: string): string => {
    if (HAS_SRC.test(attrs) || DATA_TYPE.test(attrs) || body.trim() === '') return ''
    hashes.add(`sha256-${createHash('sha256').update(body).digest('base64')}`)
    return ''
  })
  return [...hashes].sort()
}

const CHARSET_RE = /<meta\b[^>]*\bcharset=[^>]*>/i
const HEAD_OPEN_RE = /<head\b[^>]*>/i

// Una CSP in meta governa solo quello che la segue, quindi va subito dopo `<meta charset>`,
// prima di ogni script della pagina.
export function injectCspMeta(html: string, cspContent: string): string {
  const meta = `<meta http-equiv="Content-Security-Policy" content="${cspContent}">`
  const anchor = CHARSET_RE.exec(html) ?? HEAD_OPEN_RE.exec(html)
  if (!anchor) return html
  const at = anchor.index + anchor[0].length
  return `${html.slice(0, at)}${meta}${html.slice(at)}`
}
