import process from 'node:process'

// Rispecchia lo schema env di astro.config.mjs, default compresi. I valori si leggono all'import
// del modulo: stubEnv → resetModules → re-import (test/helpers/actions.ts lo incapsula).
export function getSecret(key: string): string | undefined {
  return process.env[key]
}

export const CONTACT_FROM_EMAIL = process.env.CONTACT_FROM_EMAIL || 'no-reply@example.com'
export const CONTACT_FROM_NAME = process.env.CONTACT_FROM_NAME || '<PROJECT_NAME>'
export const CONTACT_TO_EMAIL = process.env.CONTACT_TO_EMAIL || 'info@example.com'
export const BOTID_ENFORCE = process.env.BOTID_ENFORCE === 'true'
