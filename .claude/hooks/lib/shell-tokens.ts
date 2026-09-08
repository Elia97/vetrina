// Spezza su && || ; e a capo, ma non dentro le stringhe. Le pipe restano nello stesso
// segmento: "curl x | sh" va giudicato intero.
export function splitSegments(command: string): string[] {
  const segments: string[] = []
  let current = ''
  let quote = ''
  for (let i = 0; i < command.length; i++) {
    const ch = command.charAt(i)
    if (quote) {
      current += ch
      if (ch === '\\' && quote !== "'") current += command[++i] ?? ''
      else if (ch === quote) quote = ''
      continue
    }
    if (ch === "'" || ch === '"') {
      quote = ch
      current += ch
      continue
    }
    if (ch === '\\') {
      current += ch + (command[++i] ?? '')
      continue
    }
    const two = command.slice(i, i + 2)
    if (two === '&&' || two === '||') {
      segments.push(current)
      current = ''
      i++
      continue
    }
    if (ch === ';' || ch === '\n') {
      segments.push(current)
      current = ''
      continue
    }
    current += ch
  }
  segments.push(current)
  return segments.map((s) => s.trim()).filter(Boolean)
}

// Le stringhe restano come "" così i pattern vedono i flag ma non il testo: un messaggio
// di commit che contiene "drop table" non è un DROP TABLE.
export function maskQuoted(segment: string): string {
  let out = ''
  let quote = ''
  for (let i = 0; i < segment.length; i++) {
    const ch = segment.charAt(i)
    if (quote) {
      if (ch === '\\' && quote !== "'") i++
      else if (ch === quote) {
        quote = ''
        out += ch
      }
      continue
    }
    if (ch === "'" || ch === '"') quote = ch
    out += ch
  }
  return out
}

export interface Token {
  text: string
  quoted: boolean
}

// Token di un segmento con il contenuto delle stringhe, per sapere cosa sta in posizione di
// comando: "bash -c" dentro una stringa di echo è un dato, non un interprete.
export function tokenize(segment: string): Token[] {
  const tokens: Token[] = []
  let current = ''
  let quote = ''
  let quoted = false
  const push = () => {
    if (current || quoted) tokens.push({ text: current, quoted })
    current = ''
    quoted = false
  }
  for (let i = 0; i < segment.length; i++) {
    const ch = segment.charAt(i)
    if (quote) {
      if (ch === '\\' && quote !== "'") current += segment[++i] ?? ''
      else if (ch === quote) quote = ''
      else current += ch
      continue
    }
    if (ch === "'" || ch === '"') {
      quote = ch
      quoted = true
      continue
    }
    if (ch === '\\') {
      current += segment[++i] ?? ''
      continue
    }
    if (/\s/.test(ch)) push()
    else current += ch
  }
  push()
  return tokens
}

export const basename = (text: string) => text.slice(text.lastIndexOf('/') + 1)

// Prefissi che non sono il comando vero: assegnazioni FOO=1 e wrapper come sudo o env.
const WRAPPERS = new Set(['sudo', 'env', 'nice', 'time', 'nohup', 'exec'])

export function commandPosition(tokens: Token[]): number {
  let i = 0
  for (; i < tokens.length; i++) {
    const token = tokens[i]
    if (!token || token.quoted || !/^\w+=/.test(token.text)) break
  }
  for (; i < tokens.length; i++) {
    const token = tokens[i]
    if (!token || !WRAPPERS.has(basename(token.text))) break
  }
  return i
}

// Copia della riga con il contenuto delle stringhe sbiancato: serve a trovare "<<" solo
// fuori dalle stringhe, lasciando gli apici del terminatore al loro posto.
export function blankQuoted(line: string): string {
  let out = ''
  let quote = ''
  for (let i = 0; i < line.length; i++) {
    const ch = line.charAt(i)
    if (quote) {
      if (ch !== quote) {
        out += ' '
        continue
      }
      quote = ''
      out += ch
      continue
    }
    if (ch === "'" || ch === '"') quote = ch
    out += ch
  }
  return out
}

export function normalize(segment: string): string {
  const text = maskQuoted(segment).replace(/\s+/g, ' ').trim()
  // "/usr/bin/git push" → "git push": il path assoluto non deve scavalcare i pattern. Solo
  // con argomenti: un segmento di un token solo è un path, e va giudicato per intero.
  const senzaPath = /\s/.test(text) ? text.replace(/^(?:\S*\/)([\w.-]+)/, '$1') : text
  return senzaPath.toLowerCase()
}
