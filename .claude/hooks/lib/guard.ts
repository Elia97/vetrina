import { RULES, type Tier } from './guard-rules.ts'
import { innerBodies, stripHeredocs } from './shell-bodies.ts'
import { normalize, splitSegments } from './shell-tokens.ts'

export type Decision = 'allow' | Tier

export interface Verdict {
  decision: Decision
  rule?: string
  reason?: string
  segment?: string
}

const MAX_INPUT = 100_000
const MAX_SEGMENTS = 200
const MAX_DEPTH = 3
const RANK: Record<Decision, number> = { allow: 0, ask: 1, deny: 2 }

const worse = (a: Verdict, b: Verdict) => (RANK[b.decision] > RANK[a.decision] ? b : a)

export function evaluate(command: string, depth = 0): Verdict {
  if (command.length > MAX_INPUT)
    return {
      decision: 'deny',
      rule: 'guard-input-too-large',
      reason: 'comando troppo lungo per essere analizzato',
    }
  const { text, shellBodies } = stripHeredocs(command)
  const segments = [...splitSegments(text), ...shellBodies]
  if (segments.length > MAX_SEGMENTS)
    return {
      decision: 'deny',
      rule: 'guard-too-many-segments',
      reason: 'troppi segmenti per essere analizzato',
    }

  let worst: Verdict = { decision: 'allow' }
  for (const raw of segments) {
    if (depth < MAX_DEPTH) {
      for (const body of innerBodies(raw)) worst = worse(worst, evaluate(body, depth + 1))
    }
    const segment = normalize(raw)
    for (const rule of RULES) {
      if (!rule.pattern.test(segment)) continue
      worst = worse(worst, {
        decision: rule.tier,
        rule: rule.id,
        reason: rule.reason,
        segment: raw,
      })
      if (worst.decision === 'deny') return worst
    }
    if (worst.decision === 'deny') return worst
  }
  return worst
}
