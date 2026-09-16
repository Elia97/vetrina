#!/usr/bin/env node

import { spawnSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import process from 'node:process'

import { auditRoutes, expectedRoutes, readPageFiles } from './lib/routes.ts'

const PAGES_DIR = 'src/pages'
const RC_FILE = '.lighthouserc.json'
const port = process.env.LH_PORT ?? '4321'

const rc = JSON.parse(readFileSync(RC_FILE, 'utf8'))
const routes = auditRoutes(expectedRoutes(readPageFiles(PAGES_DIR), PAGES_DIR))

rc.ci.collect.url = routes.map((route) => `http://localhost:${port}${route}`)

if (process.env.LH_RUNS) rc.ci.collect.numberOfRuns = Number(process.env.LH_RUNS)

// Il server è già in ascolto: lo avvia scripts/lhci-local.sh, per servire una directory diversa.
if (process.env.LH_EXTERNAL_SERVER) {
  delete rc.ci.collect.startServerCommand
  delete rc.ci.collect.startServerReadyPattern
  delete rc.ci.collect.startServerReadyTimeout
} else {
  rc.ci.collect.startServerCommand = rc.ci.collect.startServerCommand.replace(/--listen \d+/, `--listen ${port}`)
}

if (process.env.LH_CHROME_FLAGS) {
  rc.ci.collect.settings = { ...rc.ci.collect.settings, chromeFlags: process.env.LH_CHROME_FLAGS }
}

if (process.env.LH_OUT) rc.ci.upload = { target: 'filesystem', outputDir: process.env.LH_OUT }

console.log(`\nLighthouse CI — ${routes.length} route(s) derived from ${PAGES_DIR}\n`)
for (const url of rc.ci.collect.url) console.log(`  ${url}`)
console.log()

const dir = mkdtempSync(join(tmpdir(), 'lhci-'))
const config = join(dir, 'lighthouserc.json')
writeFileSync(config, JSON.stringify(rc, null, 2))

const { status } = spawnSync('pnpm', ['dlx', '@lhci/cli', 'autorun', `--config=${config}`], { stdio: 'inherit' })
rmSync(dir, { recursive: true, force: true })

process.exit(status ?? 1)
