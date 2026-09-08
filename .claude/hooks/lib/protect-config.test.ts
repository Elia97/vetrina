import { describe, expect, it } from 'vitest'

import { classify } from '../protect-config.ts'

const root = '/repo'
const home = '/home/elia'
const decision = (path: string) => classify(path, root, home).decision

describe('protect-config', () => {
  it.each([
    ['.claude/settings.json', 'deny'],
    ['.claude/settings.local.json', 'deny'],
    ['/repo/.claude/settings.json', 'deny'],
    ['apps/../.claude/settings.json', 'deny'],
    ['/home/elia/.claude/settings.json', 'deny'],
    ['.claude/hooks/block-destructive.ts', 'ask'],
    ['.claude/hooks/lib/guard-rules.ts', 'ask'],
    ['/home/elia/.claude/hooks/x.ts', 'ask'],
    ['lefthook.yml', 'ask'],
    ['.claude/commands/review.md', 'allow'],
    ['CLAUDE.md', 'allow'],
    ['apps/api/src/index.ts', 'allow'],
    ['/tmp/settings.json', 'allow'],
    ['/other/repo/.claude/settings.json', 'allow'],
  ])('%s → %s', (path, expected) => {
    expect(decision(path)).toBe(expected)
  })
})
