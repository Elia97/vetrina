import { GIT_RULES } from './rules-git.ts'
import { SYSTEM_RULES } from './rules-system.ts'

export type Tier = 'deny' | 'ask'

export interface Rule {
  id: string
  tier: Tier
  pattern: RegExp
  reason: string
}

export const RULES: Rule[] = [...GIT_RULES, ...SYSTEM_RULES]
