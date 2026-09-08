import type { Rule } from './guard-rules.ts'

// I modi in cui una shell scrive su un file: redirezione, tee, copia, sed in place. Il path
// va lasciato fuori dalle virgolette per essere visto, che è il caso normale.
const writesTo = (target: string) =>
  new RegExp(
    `(?:>>?\\s*|\\btee\\b(?:\\s+-\\S+)*\\s+|\\b(?:cp|mv|install|ln)\\b[^|;]*?\\s)${target}` +
      `|\\b(?:sed|perl)\\b[^|;]*?\\s-\\w*i\\w*[^|;]*?${target}`,
  )

export const SYSTEM_RULES: Rule[] = [
  // lefthook legge LEFTHOOK=0 e LEFTHOOK_EXCLUDE: sono un bypass come --no-verify
  {
    id: 'rm-protected',
    tier: 'deny',
    pattern:
      /\brm\b(?=.*\s(?:-[a-z]*r[a-z]*|--recursive)\b).*\s(?:\/|\/\*|~(?:\/\S*)?|\$home(?:\/\S*)?|\.\.(?:\/\S*)?|\.|\*|\.\/\*|\.git(?:\/\S*)?|\.claude(?:\/\S*)?|\.ssh(?:\/\S*)?|\.env\S*|\/(?:etc|usr|var|bin|lib|boot|root|home|users)(?:\/\S*)?)(?:\s|$)/,
    reason: 'rm ricorsivo su un percorso protetto',
  },
  {
    id: 'rm-node-modules',
    tier: 'ask',
    pattern: /\brm\b(?=.*\s(?:-[a-z]*r[a-z]*|--recursive)\b).*\bnode_modules\/?(?:\s|$)/,
    reason: 'reinstallare costa: chiedi prima',
  },
  {
    id: 'rm-dynamic-target',
    tier: 'ask',
    pattern: /\brm\b(?=.*\s(?:-[a-z]*r[a-z]*|--recursive)\b).*\s(?:""|''|\$\{?\w)/,
    reason: 'bersaglio dinamico: non si sa cosa cancella',
  },
  {
    id: 'bulk-delete',
    tier: 'ask',
    pattern: /\bfind\b.*(?:\s-delete\b|-exec\s+rm\b)|\bxargs\b.*\brm\b/,
    reason: 'cancellazione in massa',
  },
  {
    id: 'disk-device',
    tier: 'deny',
    pattern: /\bmkfs\b|\bdd\b.*\bof=\/dev\/|\bshred\b|>\s*\/dev\/(?:sd|nvme|disk)/,
    reason: 'scrive direttamente su un dispositivo',
  },
  {
    id: 'fork-bomb',
    tier: 'deny',
    pattern: /:\(\)\s*\{\s*:\|:&\s*\}/,
    reason: 'fork bomb',
  },
  {
    id: 'pipe-to-shell',
    tier: 'deny',
    pattern: /\b(?:curl|wget)\b.*\|\s*(?:sudo\s+)?(?:ba|z|da)?sh\b/,
    reason: 'esegue codice scaricato senza leggerlo',
  },
  {
    id: 'sudo',
    tier: 'deny',
    pattern: /(?:^|\s)sudo\s/,
    reason: "niente privilegi elevati dall'agente",
  },
  {
    id: 'chmod-world',
    tier: 'ask',
    pattern: /\bchmod\b.*\s(?:-r\s+)?[0-7]*777\b|\bchmod\b.*\+s\b/,
    reason: 'permessi aperti a tutti',
  },
  {
    id: 'wrong-package-manager',
    tier: 'deny',
    pattern:
      /(?:^|\s)(?:npm\s+(?:install|i|ci|add|remove|uninstall|update|up)\b|yarn\b|bun\s+(?:install|add|remove)\b)/,
    reason: 'il progetto usa pnpm',
  },
  {
    id: 'publish',
    tier: 'ask',
    pattern: /\b(?:npm|pnpm)\s+publish\b/,
    reason: 'pubblica su un registry',
  },
  {
    id: 'gh-delete',
    tier: 'deny',
    pattern: /\bgh\s+api\b.*(?:\s-x|--method)\s+delete\b|\bgh\s+(?:repo|release|gist)\s+delete\b/,
    reason: 'cancellazione su GitHub',
  },
  {
    id: 'gh-milestone-patch',
    tier: 'ask',
    pattern: /\bgh\s+api\b.*(?:\s-x|--method)\s+patch\b.*milestones\/\d/,
    reason: 'modifica una milestone',
  },
  {
    id: 'db-destructive',
    tier: 'deny',
    pattern: /\bdrop\s+(?:database|table|schema)\b|\btruncate\s+(?:table\s+)?\w|\bdropdb\b/,
    reason: 'distrugge dati',
  },
  // La produzione esce da un tag di release e da lì soltanto: un --prod a mano scavalca il
  // gate, la catena di deploy.yml e lo smoke test (docs/guides/deploy-ops.md § Modello di deploy).
  {
    id: 'vercel-prod',
    tier: 'ask',
    pattern: /\bvercel(?:@[\w.-]+)?\b(?:\s+\S+)*\s--prod\b|\bvercel\s+(?:deploy|promote)\b/,
    reason: 'manda in produzione fuori dalla catena di release',
  },
  {
    id: 'vercel-remove',
    tier: 'deny',
    pattern: /\bvercel\s+(?:remove|rm)\b|\bvercel\s+project\s+rm\b/,
    reason: 'cancella un deployment o un progetto Vercel',
  },

  // L'altra metà di protect-config: quello guarda Edit e Write, questo le scritture da shell.
  {
    id: 'config-write',
    tier: 'deny',
    pattern: writesTo(String.raw`\.claude\/settings[^/\s]*\.json`),
    reason: 'riscrive la configurazione dei hook',
  },
  {
    id: 'hooks-write',
    tier: 'ask',
    pattern: writesTo(String.raw`\.claude\/hooks\/\S+`),
    reason: 'riscrive un gate',
  },

  // Un comando ha sempre un verbo davanti: un segmento fatto di solo path arriva da un
  // letterale estratto dal codice di node o python, non dalla shell.
  {
    id: 'config-path-literal',
    tier: 'deny',
    pattern: /^(?:.*\/)?\.claude\/settings[^/]*\.json$/,
    reason: 'il codice scrive sulla configurazione dei hook',
  },
  {
    id: 'hooks-path-literal',
    tier: 'ask',
    pattern: /^(?:.*\/)?\.claude\/hooks\/\S+$/,
    reason: 'il codice scrive su un gate',
  },
]
