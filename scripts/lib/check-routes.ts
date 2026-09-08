import { existsSync, readFileSync } from 'node:fs'

import type { Hit } from './cli.ts'

// I documenti si rimandano l'un l'altro per percorso e per sezione, e un rimando morto non
// rompe niente: sopravvive finché qualcuno non lo segue e non trova quello che cercava.
const SCANNED = /\.md$/

// Fuori dal controllo, e ognuno per una ragione sua.
const IGNORED = [
  // Scritti a runtime dai comandi, gitignored per costruzione.
  /^\.claude\/plans\//,
  // Materia commerciale: non tracciata per scelta, quindi assente su un clone pulito.
  /^docs\/ESTIMATE\.md$/,
  /^docs\/MEETING-/,
  /^docs\/SBLOCCO-/,
  /\.pdf$/,
  // Il materiale del cliente cambia nome a ogni progetto.
  /^docs\/sources\//,
]

const PERCORSO = /`((?:docs|src|scripts|test|public|\.claude|\.github)\/[A-Za-z0-9._/-]+\.[a-z]+)`/g
// `file.md` § Titolo — la virgola non delimita, perché i titoli la contengono.
const SEZIONE = /`([A-Za-z0-9._/-]+\.md)`\s*§\s*([^.·|)§]{1,80})/g

// Un comando si cita `/<nome>` e vive in .claude/commands/<nome>.md, a volte con la sua fase.
const COMANDO = /`\/([a-z][a-z-]{2,})`(?:\*{0,2}\s*Fase\s*(\d+))?/g
// Il nome si verifica solo dove il vocabolario è chiuso: le guide citano le rotte del sito
// (`/contatti`, `/privacy`), che hanno la stessa forma e non sono comandi.
const VOCABOLARIO_CHIUSO = /^(?:\.claude\/commands\/|docs\/TASK-CONTEXT\.md$|CLAUDE\.md$)/
// Builtin di Claude Code, non di questo repo.
const BUILTIN = new Set(['clear'])

const isIgnored = (path: string) => IGNORED.some((re) => re.test(path))

export const isScanned = (path: string): boolean => SCANNED.test(path) && !isIgnored(path)

/** Un titolo citato in prosa porta con sé la formattatura e la frase che segue. */
export function normalizeTitle(raw: string): string {
  return (
    raw
      .replace(/\*\*/g, '')
      .replace(/`/g, '')
      // Il marcatore non fa parte del nome: «Come si lavora [HARD]» si cita «Come si lavora».
      .replace(/\s*\[[A-Z-]+\]\s*$/, '')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase()
  )
}

/** I titoli di un documento, dal livello 2 in giù: il livello 1 è il nome del documento. */
export function headings(source: string): string[] {
  return source
    .split('\n')
    .filter((line) => /^#{2,4} /.test(line))
    .map((line) => normalizeTitle(line.replace(/^#+\s*/, '')))
}

/**
 * Il titolo si cita **per intero**: accettare un prefisso accetterebbe anche «§ S». La prosa può
 * proseguire dopo, purché il titolo finisca dove finisce davvero — non a metà parola.
 */
const resolves = (titles: string[], cited: string) =>
  titles.some(
    (title) => cited === title || (cited.startsWith(title) && /^[^\p{L}\p{N}]/u.test(cited.slice(title.length))),
  )

/** Il percorso del file citato, relativo alla radice: una guida ne cita un'altra per nome. */
export function resolveTarget(from: string, cited: string): string {
  if (cited.includes('/')) return cited
  const sibling = `${from.slice(0, from.lastIndexOf('/') + 1)}${cited}`
  return existsSync(sibling) ? sibling : cited
}

/** Le fasi dichiarate da un comando: `## Fase 3 — Verifica contro il codice`. */
export function phases(source: string): number[] {
  return source
    .split('\n')
    .map((line) => /^## Fase (\d+)/.exec(line)?.[1])
    .filter((n) => n !== undefined)
    .map(Number)
}

/**
 * Un comando rinominato o una fase rinumerata lasciano rimandi che puntano nel vuoto, e nessuno se
 * ne accorge finché non li segue.
 */
function commandFindings(path: string, flat: string, lineOf: (i: number) => number): Hit[] {
  const findings: Hit[] = []
  const closed = VOCABOLARIO_CHIUSO.test(path)

  for (const match of flat.matchAll(COMANDO)) {
    const [, name, phase] = match
    /* v8 ignore next -- il primo gruppo è obbligatorio nella regex, ma noUncheckedIndexedAccess pretende la guardia */
    if (!name || BUILTIN.has(name)) continue
    if (!closed && phase === undefined) continue

    const file = `.claude/commands/${name}.md`
    if (!existsSync(file)) {
      findings.push({ line: lineOf(match.index), message: `comando che non esiste: /${name}` })
      continue
    }
    if (phase !== undefined && !phases(readFileSync(file, 'utf8')).includes(Number(phase)))
      findings.push({ line: lineOf(match.index), message: `fase che non esiste: /${name} Fase ${phase}` })
  }

  return findings
}

export function findingsFor(path: string, source: string): Hit[] {
  const findings: Hit[] = []
  // Un titolo va a capo come qualunque prosa: si cerca su testo continuo. La sostituzione è uno a
  // uno, quindi gli offset restano quelli del sorgente e la riga si conta da lì.
  const flat = source.replace(/\n/g, ' ')
  const lineOf = (index: number) => source.slice(0, index).split('\n').length
  const mancanti = new Set<string>()

  for (const match of flat.matchAll(PERCORSO)) {
    const target = match[1]
    if (!target || isIgnored(target) || target.includes('*') || existsSync(target)) continue
    mancanti.add(target)
    findings.push({ line: lineOf(match.index), message: `percorso che non esiste: ${target}` })
  }

  for (const match of flat.matchAll(SEZIONE)) {
    const [, file, title] = match
    /* v8 ignore next -- i due gruppi sono obbligatori nella regex, ma noUncheckedIndexedAccess pretende la guardia */
    if (!file || !title) continue
    const line = lineOf(match.index)
    const target = resolveTarget(path, file)
    if (isIgnored(target) || mancanti.has(target)) continue
    if (!existsSync(target)) {
      findings.push({ line, message: `sezione in un file che non esiste: ${target}` })
      continue
    }
    const cited = normalizeTitle(title)
    if (!resolves(headings(readFileSync(target, 'utf8')), cited))
      findings.push({ line, message: `sezione che non esiste: ${target} § ${cited}` })
  }

  findings.push(...commandFindings(path, flat, lineOf))

  return findings.sort((a, b) => a.line - b.line)
}
