import process from 'node:process'

// Rispecchia la metà client dello schema env di astro.config.mjs: ogni chiave è
// `optional: true`, quindi non impostata si legge come undefined — lo stato non configurato.
export const PUBLIC_GTM_ID: string | undefined = process.env.PUBLIC_GTM_ID
export const PUBLIC_IUBENDA_SITE_ID: string | undefined = process.env.PUBLIC_IUBENDA_SITE_ID
export const PUBLIC_IUBENDA_COOKIE_POLICY_ID: string | undefined = process.env.PUBLIC_IUBENDA_COOKIE_POLICY_ID
