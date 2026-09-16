#!/usr/bin/env node
// L'unico controllo che vede cosa serve davvero il bordo: src/vercel-headers.test.ts fissa solo vercel.json.

import process from 'node:process'

import { SITE } from '../src/lib/site.ts'
import { expectedRoutes, readPageFiles, smokeRoutes } from './lib/routes.ts'
import { runChecks, waitForAlias } from './lib/smoke-production.ts'

const PAGES_DIR = 'src/pages'

// L'apice, non l'URL *.vercel.app che stampa `vercel deploy`: lì la regola `has: host` di vercel.json mette noindex.
const baseUrl = (process.argv[2] ?? SITE.url).replace(/\/+$/, '')

if (process.argv[2] === undefined && new URL(SITE.url).host === 'example.com') {
  console.error('\n✗ SITE.url is still the template placeholder — pass a URL: pnpm smoke:prod https://…\n')
  process.exit(1)
}

const context = {
  get: (url) => fetch(url, { redirect: 'manual' }),
  baseUrl,
  siteUrl: SITE.url,
}

const pages = smokeRoutes(expectedRoutes(readPageFiles(PAGES_DIR), PAGES_DIR))

console.log(`\nProduction smoke — ${baseUrl}\n`)

await waitForAlias(context, (ms) => new Promise((resolve) => setTimeout(resolve, ms)))
const results = await runChecks(context, pages)

for (const { check, status, detail } of results) {
  if (status === 'pass') console.log(`✓ ${check}`)
  else if (status === 'skip') console.log(`- ${check} (skipped: ${detail})`)
  else console.error(`✗ ${check} — ${detail}`)
}

const failures = results.filter(({ status }) => status === 'fail')
if (failures.length > 0) {
  console.error(`\n✗ ${failures.length} check(s) failed:`)
  console.error(`${failures.map(({ check, detail }) => `  - ${check} — ${detail}`).join('\n')}\n`)
  console.error('Production is live and broken. Roll back from the Vercel dashboard:')
  console.error('Deployments → the last known-good production deployment → Promote to Production.\n')
  process.exit(1)
}
console.log(`\n✓ Every check passed on ${baseUrl}.\n`)
