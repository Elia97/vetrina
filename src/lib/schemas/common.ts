import type { ImageFunction } from 'astro:content'
import { z } from 'astro/zod'

// [HARD] Gli schemi di contenuto sono stretti: un `z.object` normale SCARTA le chiavi
// sconosciute, quindi un campo scritto male sparisce dalla pagina con la build verde.

// [HARD] `URL.canParse` accetta `javascript:` e `data:`, e `//evil.example` si legge come
// relativo pur portando fuori dal sito: entrambi arrivano a un `href` senza escaping.
const CTA_PROTOCOLS: readonly string[] = ['http:', 'https:', 'mailto:', 'tel:']

function isAllowedCtaUrl(value: string): boolean {
  if (value.startsWith('#')) return true
  if (value.startsWith('//')) return false
  if (value.startsWith('/')) return true
  return URL.canParse(value) && CTA_PROTOCOLS.includes(new URL(value).protocol)
}

export const ctaSchema = z.strictObject({
  label: z.string().min(1),
  url: z.string().min(1).refine(isAllowedCtaUrl, {
    message: 'url must be a relative path (/…), an anchor (#…) or an http(s)/mailto/tel URL',
  }),
})
export type Cta = z.infer<typeof ctaSchema>

export function imageSchema(image: ImageFunction) {
  return z.strictObject({ src: image(), alt: z.string() })
}

export function backgroundSchema(image: ImageFunction) {
  return z.strictObject({ src: image() })
}
