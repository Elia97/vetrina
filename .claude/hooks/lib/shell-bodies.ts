import { basename, blankQuoted, commandPosition, tokenize } from './shell-tokens.ts'

const SHELLS = new Set(['bash', 'sh', 'zsh', 'dash'])
const SCRIPT_INTERPRETERS = new Set(['node', 'python', 'python3', 'perl', 'ruby'])
const DB_CLIENTS = new Set(['psql', 'mysql', 'sqlite3'])
// Codice in un altro linguaggio viene riletto come shell solo se lancia davvero comandi.
const EXEC_OR_WRITE_LIKE =
  /\b(?:exec|spawn|system|popen|subprocess|child_process|writeFile|writeFileSync|appendFile|createWriteStream|copyFile|rename|unlink|open\()/

// Cosa esegue un interprete in posizione di comando: bash -c '…', psql -c '…'. Per node e
// python contano le stringhe del codice, e solo se il codice lancia comandi.
export function interpreterBodies(segment: string): string[] {
  const tokens = tokenize(segment)
  const at = commandPosition(tokens)
  const command = tokens[at]
  if (!command || command.quoted) return []
  const name = basename(command.text)
  const isShell = SHELLS.has(name)
  const isScript = SCRIPT_INTERPRETERS.has(name)
  if (!isShell && !isScript && !DB_CLIENTS.has(name)) return []

  let body: string | undefined
  if (name === 'sqlite3') {
    body = tokens.slice(at + 1).find((t) => t.quoted)?.text
  } else {
    const flag = isShell ? /^-[a-z]*c[a-z]*$/ : /^-[ce]$|^--(?:eval|command)$/
    const index = tokens.findIndex((t, i) => i > at && !t.quoted && flag.test(t.text))
    body = index !== -1 ? tokens[index + 1]?.text : undefined
  }
  if (!body) return []
  if (!isScript) return [body]
  if (!EXEC_OR_WRITE_LIKE.test(body)) return []
  return stringLiterals(body)
}

function stringLiterals(code: string): string[] {
  const literals: string[] = []
  let quote = ''
  let current = ''
  for (let i = 0; i < code.length; i++) {
    const ch = code.charAt(i)
    if (!quote) {
      if (ch === "'" || ch === '"' || ch === '`') quote = ch
      continue
    }
    if (ch === '\\') current += code[++i] ?? ''
    else if (ch === quote) {
      if (current.trim()) literals.push(current)
      current = ''
      quote = ''
    } else current += ch
  }
  return literals
}

// $(…) e backtick vengono eseguiti anche tra doppi apici, ma non tra apici singoli.
export function substitutions(segment: string): string[] {
  let visible = ''
  let quote = ''
  for (let i = 0; i < segment.length; i++) {
    const ch = segment.charAt(i)
    if (quote === "'") {
      if (ch === "'") quote = ''
      visible += ' '
      continue
    }
    if (ch === '\\') {
      visible += '  '
      i++
      continue
    }
    if (ch === "'" && quote !== '"') quote = "'"
    else if (ch === '"') quote = quote === '"' ? '' : '"'
    visible += ch
  }

  const bodies: string[] = []
  for (const m of visible.matchAll(/`([^`]*)`/g))
    bodies.push(segment.slice(m.index + 1, m.index + 1 + (m[1]?.length ?? 0)))
  for (let at = visible.indexOf('$('); at !== -1; at = visible.indexOf('$(', at + 2)) {
    let depth = 0
    for (let i = at + 1; i < visible.length; i++) {
      if (visible[i] === '(') depth++
      else if (visible[i] === ')' && --depth === 0) {
        bodies.push(segment.slice(at + 2, i))
        break
      }
    }
  }
  return bodies.filter((b) => b.trim())
}

export function innerBodies(segment: string): string[] {
  return [...interpreterBodies(segment), ...substitutions(segment)]
}

const HEREDOC = /<<-?\s*(['"]?)(\w+)\1/

// Il corpo di un heredoc è un dato, salvo quando viene dato in pasto a una shell.
export function stripHeredocs(command: string): {
  text: string
  shellBodies: string[]
} {
  const lines = command.split('\n')
  const kept: string[] = []
  const shellBodies: string[] = []
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? ''
    kept.push(line)
    const at = blankQuoted(line).indexOf('<<')
    const m = at === -1 ? null : HEREDOC.exec(line.slice(at))
    if (!m) continue
    const terminator = m[2] ?? ''
    const body: string[] = []
    for (i++; i < lines.length; i++) {
      const next = lines[i] ?? ''
      if (next.replace(/^\t+/, '') === terminator) break
      body.push(next)
    }
    const tokens = tokenize(line.slice(0, at))
    const command = tokens[commandPosition(tokens)]
    if (command && !command.quoted && SHELLS.has(basename(command.text))) shellBodies.push(body.join('\n'))
  }
  return { text: kept.join('\n'), shellBodies }
}
