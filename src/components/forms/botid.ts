import { initBotId } from 'botid/client/core'

// I percorsi che il client delle azioni di Astro chiama (`<base>/_actions/<nome>`): uno che
// manca qui non porta l'intestazione della sfida e in src/actions/index.ts si legge come bot.
const PROTECTED_ACTIONS = [{ path: '/_actions/contact', method: 'POST' }]

// A monte initBotId non è idempotente: ogni chiamata ripatcha fetch e XHR e azzera la sfida.
let initialized = false

// Lo script della sfida è servito dai rewrite di vercel.json, che `astro dev` non legge mai.
export function initFormBotId(): void {
  if (!import.meta.env.PROD || initialized) return
  initialized = true
  initBotId({ protect: PROTECTED_ACTIONS })
}
