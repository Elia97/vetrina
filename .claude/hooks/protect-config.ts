#!/usr/bin/env node
// Hook PreToolUse su Edit|Write|MultiEdit|NotebookEdit: la configurazione dei gate non si
// tocca (deny), i gate stessi solo con conferma (ask). L'altra metà è nel guard Bash.
import { existsSync, readFileSync, realpathSync } from 'node:fs'
import { homedir } from 'node:os'
import { relative, resolve, sep } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

type Decision = 'allow' | 'ask' | 'deny'
export interface Verdict {
  decision: Decision
  reason?: string
}

const SETTINGS = /^\.claude\/settings[^/]*\.json$/
const HOOKS = /^\.claude\/hooks\//
// lefthook.yml è il gate di commit: modificarlo equivale a un --no-verify permanente.
const GATES = /^lefthook\.ya?ml$/

const inside = (root: string, file: string) => {
  const rel = relative(root, file)
  return rel && !rel.startsWith('..') && !rel.includes(`..${sep}`) ? rel.split(sep).join('/') : null
}

export function classify(filePath: string, root: string, home: string): Verdict {
  let file = resolve(root, filePath)
  // Un symlink che punta dentro .claude/ va giudicato per dove arriva.
  if (existsSync(file)) file = realpathSync(file)

  for (const base of [root, home]) {
    const rel = inside(base, file)
    if (!rel) continue
    if (SETTINGS.test(rel))
      return {
        decision: 'deny',
        reason: `${rel} configura i hook: non si modifica dall'agente`,
      }
    if (HOOKS.test(rel))
      return {
        decision: 'ask',
        reason: `${rel} è un gate: modifica solo con conferma`,
      }
    if (base === root && GATES.test(rel))
      return {
        decision: 'ask',
        reason: `${rel} è il gate di commit: modifica solo con conferma`,
      }
  }
  return { decision: 'allow' }
}

function respond(verdict: Verdict): never {
  if (verdict.decision === 'allow') process.exit(0)
  console.log(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: verdict.decision,
        permissionDecisionReason: `[protect-config] ${verdict.reason}`,
      },
    }),
  )
  process.exit(0)
}

function main(): void {
  let filePath: unknown
  try {
    const input = JSON.parse(readFileSync(0, 'utf8')) as {
      tool_input?: { file_path?: unknown; notebook_path?: unknown }
    }
    filePath = input.tool_input?.file_path ?? input.tool_input?.notebook_path
  } catch (error) {
    respond({
      decision: 'deny',
      reason: `input del hook non leggibile (${(error as Error).message})`,
    })
  }
  if (typeof filePath !== 'string') process.exit(0)
  const { CLAUDE_PROJECT_DIR } = process.env
  respond(classify(filePath, CLAUDE_PROJECT_DIR ?? process.cwd(), homedir()))
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main()
