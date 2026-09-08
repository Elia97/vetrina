import type { Rule } from './guard-rules.ts'

// I pattern girano su un segmento già normalizzato: minuscolo, spazi collassati, contenuto
// delle stringhe quotate rimosso (resta ""), path assoluto del binario tolto.
const git = (sub: string) => new RegExp(`\\bgit(?:\\s+-c\\s+\\S+)*\\s+${sub}`)

export const GIT_RULES: Rule[] = [
  {
    id: 'git-push-force',
    tier: 'deny',
    pattern: git('push\\b.*(?:\\s--force(?:-with-lease)?\\b|\\s-f\\b|\\s\\+\\S)'),
    reason: 'push forzato: riscrive la storia remota',
  },
  {
    id: 'git-push-delete',
    tier: 'ask',
    pattern: git('push\\b.*(?:\\s--delete\\b|\\s-d\\b|\\s:\\w)'),
    reason: 'cancella un branch remoto',
  },
  {
    id: 'git-reset-hard',
    tier: 'deny',
    pattern: git('reset\\b.*--hard\\b'),
    reason: 'scarta le modifiche locali senza recupero',
  },
  {
    id: 'git-clean-force',
    tier: 'deny',
    pattern: git('clean\\b.*\\s-[a-z]*f'),
    reason: 'cancella i file non tracciati',
  },
  {
    id: 'git-checkout-discard',
    tier: 'deny',
    pattern: git('checkout\\s+(?:--\\s|\\.(?:\\s|$))'),
    reason: 'scarta le modifiche del worktree',
  },
  {
    id: 'git-restore-worktree',
    tier: 'deny',
    pattern: git('restore\\b(?:(?!.*--staged)|.*--staged.*(?:--worktree|\\s-w\\b))'),
    reason: 'scarta le modifiche del worktree',
  },
  {
    id: 'git-history-rewrite',
    tier: 'deny',
    pattern: git('(?:filter-repo|filter-branch)\\b'),
    reason: 'riscrive tutta la storia',
  },
  {
    id: 'git-rebase-interactive',
    tier: 'deny',
    pattern: git('rebase\\b.*(?:\\s-i\\b|--interactive\\b)'),
    reason: 'rebase interattivo: senza terminale resta appeso',
  },
  {
    id: 'git-amend',
    tier: 'ask',
    pattern: git('commit\\b.*--amend\\b'),
    reason: "riscrive l'ultimo commit",
  },
  {
    id: 'git-stash-drop',
    tier: 'ask',
    pattern: git('stash\\s+(?:drop|clear)\\b'),
    reason: 'butta via uno stash',
  },
  {
    id: 'git-reflog-prune',
    tier: 'ask',
    pattern: git('(?:reflog\\s+expire|gc\\b.*--prune|prune)\\b'),
    reason: 'toglie la rete di sicurezza del reflog',
  },
  {
    id: 'gate-bypass',
    tier: 'deny',
    pattern:
      /--no-verify\b|--no-gpg-sign\b|commit\.gpgsign=false|core\.hookspath=|\blefthook=0\b|\blefthook_exclude=|\bhusky=0\b/,
    reason: 'aggira i gate di qualità',
  },
  {
    id: 'git-commit-no-verify-short',
    tier: 'deny',
    pattern: git('commit\\b.*\\s-n\\b'),
    reason: 'aggira i gate di qualità (-n è --no-verify)',
  },
]
