#!/usr/bin/env node
// Hook PreToolUse su Bash. Risponde con JSON (deny/ask) ed esce sempre 0: un exit diverso
// da 0 e 2 per Claude Code è un errore non bloccante, cioè un allow silenzioso.
import { appendFileSync, mkdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import process from 'node:process'

// Se l'analizzatore (che vive nella repo sorvegliata) è rotto, decide l'utente; questa
// lista senza import tiene chiuse le porte peggiori anche allora.
const FALLBACK = [
  /\brm\s+-[a-z]*r[a-z]*\s+(?:\/|~|\$home|\.|\*)(?:\s|$)/i,
  /\bgit\s+push\b.*(?:--force|\s-f\b|\s\+\w)/i,
  /\bgit\s+reset\b.*--hard/i,
  /--no-verify\b/i,
  /(?:^|\s)sudo\s/i,
  /\bmkfs\b|\bdd\b.*\bof=\/dev\//i,
]

type Decision = 'allow' | 'ask' | 'deny'
interface Verdict {
  decision: Decision
  rule?: string
  reason?: string
  segment?: string
}

const { CLAUDE_PROJECT_DIR } = process.env
const projectDir = CLAUDE_PROJECT_DIR ?? process.cwd()
const LOG = join(projectDir, '.claude', 'hooks', 'guard-log.jsonl')

const redact = (text: string) => text.replace(/(--?(?:password|token|secret|key)[=\s]+)\S+/gi, '$1***')

function respond(verdict: Verdict, command: string): never {
  if (verdict.decision === 'allow') process.exit(0)

  try {
    mkdirSync(dirname(LOG), { recursive: true })
    appendFileSync(
      LOG,
      `${JSON.stringify({
        at: new Date().toISOString(),
        decision: verdict.decision,
        rule: verdict.rule,
        command: redact(command).slice(0, 160),
      })}\n`,
    )
  } catch {
    // il log serve a tarare i falsi positivi, non è una condizione per decidere
  }

  const reason =
    verdict.decision === 'deny'
      ? `Comando bloccato da .claude/hooks/block-destructive.ts [${verdict.rule}]: ${verdict.reason}.\n` +
        `Segmento: ${verdict.segment ?? command}\n` +
        'Se serve davvero, chiedi conferma esplicita all\'utente e fallo fare a lui. Le regole stanno in CLAUDE.md, sezione "Come si lavora [HARD]".'
      : `[${verdict.rule}] ${verdict.reason}. Segmento: ${verdict.segment ?? command}`

  console.log(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: verdict.decision,
        permissionDecisionReason: reason,
      },
    }),
  )
  process.exit(0)
}

let command = ''
try {
  const input = JSON.parse(readFileSync(0, 'utf8')) as {
    tool_name?: string
    tool_input?: { command?: unknown }
  }
  if (input.tool_name && input.tool_name !== 'Bash') process.exit(0)
  if (typeof input.tool_input?.command !== 'string') process.exit(0)
  command = input.tool_input.command
} catch (error) {
  // Comando ignoto: non si sa cosa si sta per eseguire, si nega.
  respond(
    {
      decision: 'deny',
      rule: 'guard-input-unreadable',
      reason: `input del hook non leggibile (${(error as Error).message})`,
    },
    '',
  )
}

try {
  // Import dinamico: un errore di sintassi in guard.ts deve finire qui sotto, non far
  // uscire il processo con exit 1, che per Claude Code è un allow.
  const { evaluate } = await import('./lib/guard.ts')
  respond(evaluate(command), command)
} catch (error) {
  const message = (error as Error).message.split('\n')[0]
  const hit = FALLBACK.find((re) => re.test(command))
  if (hit)
    respond(
      {
        decision: 'deny',
        rule: 'guard-fallback',
        reason: `analizzatore rotto (${message}), regola minima di riserva`,
      },
      command,
    )
  respond(
    {
      decision: 'ask',
      rule: 'guard-internal-error',
      reason: `il guard è rotto (${message}) e non ha potuto giudicare il comando: decide l'utente`,
    },
    command,
  )
}
