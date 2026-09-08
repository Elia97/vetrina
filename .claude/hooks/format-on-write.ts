#!/usr/bin/env node
// Hook PostToolUse su Edit|Write|MultiEdit: formatta il file appena scritto con lo stesso
// comando di lefthook (script "biome:fix" in package.json), così esiste una sola definizione.
import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { resolve, sep } from 'node:path'
import process from 'node:process'

const BIOME_FILES = /\.(?:[cm]?[jt]sx?|json[c5]?|css|astro|html|vue|svelte|graphql|gql)$/i
const MAX_LINES = 60

let filePath: unknown
try {
  filePath = (
    JSON.parse(readFileSync(0, 'utf8')) as {
      tool_input?: { file_path?: unknown }
    }
  ).tool_input?.file_path
} catch {
  process.exit(0)
}
if (typeof filePath !== 'string') process.exit(0)

const { CLAUDE_PROJECT_DIR } = process.env
const root = CLAUDE_PROJECT_DIR ?? process.cwd()
const file = resolve(root, filePath)
// Fuori dal progetto (~/.claude, /tmp, altri repo) non si tocca niente.
if (!file.startsWith(root + sep)) process.exit(0)
if (!existsSync(file) || !BIOME_FILES.test(file)) process.exit(0)
if (!existsSync(resolve(root, 'node_modules'))) process.exit(0)

const result = spawnSync('pnpm', ['-s', 'biome:fix', '--colors=off', file], {
  cwd: root,
  encoding: 'utf8',
})
if (result.error || result.status === 0) process.exit(0)

// Restano diagnostiche che --write non ha risolto: con exit 2 Claude le vede e le sistema.
const output = `${result.stdout}\n${result.stderr}`
  .trim()
  .split('\n')
  .filter((line) => !/^(?:\[ELIFECYCLE\]|\$ |Done in|Already up to date)/.test(line))
console.error([`biome:fix su ${filePath} ha lasciato problemi da sistemare:`, ...output.slice(0, MAX_LINES)].join('\n'))
process.exit(2)
