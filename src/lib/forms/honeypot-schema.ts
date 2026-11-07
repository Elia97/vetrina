import { z } from 'astro/zod'

import { HONEYPOT_FIELD } from '@/lib/forms/honeypot'

// Diviso da ./honeypot.ts per la ragione [HARD] sul bundle annotata lì.

// [HARD] `.catch()` tiene la forma totale: `defineAction` valida prima che l'handler giri, e
// un 400 che nomina il campo trappola dice al bot quale svuotare al giro dopo.
export const honeypotShape = {
  [HONEYPOT_FIELD]: z.string().trim().max(200).default('').catch('__unparseable__'),
}
