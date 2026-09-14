// L'input nascosto in src/components/forms/honeypot-field.astro porta questo nome.

// [HARD] Nessun import di Zod: questo arriva nel bundle client, e una chiamata `z.…()` a
// livello di modulo non è eliminabile dal tree shaking — circa 12 KB gzip per pagina, su cui
// `pnpm perf:bundle` fallisce.
export const HONEYPOT_FIELD = 'website'

export function isHoneypotFilled(input: Record<typeof HONEYPOT_FIELD, string>): boolean {
  return input[HONEYPOT_FIELD].length > 0
}
