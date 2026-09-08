import { rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it, vi } from 'vitest'

import { main as checkComments } from './check-comments.ts'
import { main as checkLanguage } from './check-language.ts'
import { main as checkRoadmap } from './check-roadmap.ts'
import { main as checkRoutes } from './check-routes.ts'

const ROOT = fileURLToPath(new URL('../', import.meta.url))

// Un file scorretto scritto per davvero: i gate leggono dal repository, e senza un file che li
// faccia scattare si verifica solo che passino, mai che trovino qualcosa.
const conFileScorretto = <T>(nome: string, contenuto: string, fn: () => T): T => {
  const percorso = join(ROOT, 'scripts', nome)
  writeFileSync(percorso, contenuto)
  try {
    return fn()
  } finally {
    rmSync(percorso, { force: true })
  }
}

// I due gate girano sul repository vero: è il caso che conta, perché un gate che passa solo su
// un fixture inventato non dice niente sullo stato del progetto.
const zitto = <T>(fn: () => T): { esito: T; righe: string[] } => {
  const righe: string[] = []
  vi.spyOn(console, 'log').mockImplementation((riga: string) => {
    righe.push(riga)
  })
  try {
    return { esito: fn(), righe }
  } finally {
    vi.restoreAllMocks()
  }
}

describe('check:comments', () => {
  it('passa sul repository e dice quante righe sono commento', () => {
    const { esito, righe } = zitto(() => checkComments([]))
    expect(esito).toBe(0)
    expect(righe.join('\n')).toMatch(/righe sono commento/)
  })

  it('con --diff guarda solo ciò che il branch ha toccato', () => {
    const { esito, righe } = zitto(() => checkComments(['--diff']))
    expect(esito).toBe(0)
    expect(righe.join('\n')).toContain('solo file toccati dal branch')
  })
})

describe('check:language', () => {
  it('passa sul repository e conta i file con prosa', () => {
    const { esito, righe } = zitto(() => checkLanguage([]))
    expect(esito).toBe(0)
    expect(righe.join('\n')).toMatch(/file con prosa/)
  })

  it('in formato github non stampa nulla se non ha niente da annotare', () => {
    const { esito, righe } = zitto(() => checkLanguage(['--format', 'github']))
    expect(esito).toBe(0)
    expect(righe.filter((r) => r.startsWith('::'))).toEqual([])
  })
})

describe('i gate trovano i problemi, non solo li cercano', () => {
  it('check:comments respinge un blocco di prosa oltre le due righe', () => {
    const { esito, righe } = conFileScorretto(
      '__prova-commenti.ts',
      [
        '// Prima riga di prosa che continua oltre il limite',
        '// e prosegue su una seconda riga di prosa',
        '// e ancora su una terza riga di prosa.',
        'export const a = 1',
        '',
      ].join('\n'),
      () => zitto(() => checkComments(['--diff'])),
    )

    expect(esito).toBe(1)
    expect(righe.join('\n')).toContain('__prova-commenti.ts')
    expect(righe.join('\n')).toMatch(/righe di prosa/)
  })

  it('check:language respinge la prosa scritta in inglese', () => {
    const { esito, righe } = conFileScorretto(
      '__prova-lingua.ts',
      [
        '// This comment is written in English and the gate should notice that',
        '// because the words here are the ones that make it decide.',
        'export const b = 2',
        '',
      ].join('\n'),
      () => zitto(() => checkLanguage(['--diff'])),
    )

    expect(esito).toBe(1)
    expect(righe.join('\n')).toContain('__prova-lingua.ts')
  })

  it('check:comments segnala un file in cui i commenti prendono il sopravvento', () => {
    const { esito, righe } = conFileScorretto(
      '__prova-densita.ts',
      [
        '// Nota breve.',
        'export const a = 1',
        '// Altra nota.',
        'export const b = 2',
        '// Terza nota.',
        'export const c = 3',
        '',
      ].join('\n'),
      () => zitto(() => checkComments(['--diff'])),
    )

    expect(esito).toBe(0)
    expect(righe.join('\n')).toMatch(/righe sono commento/)
  })
})

describe('check:routes', () => {
  it('passa sul repository e conta i documenti', () => {
    const { esito, righe } = zitto(() => checkRoutes([]))

    expect(esito).toBe(0)
    expect(righe.join('\n')).toMatch(/documenti/)
  })

  it('segnala un rimando a una sezione che non esiste', () => {
    const { esito, righe } = conFileScorretto(
      '__prova-rotte.md',
      'vedi `docs/ARCHITECTURE.md` § Sezione Che Non Esiste\n',
      () => zitto(() => checkRoutes(['--diff'])),
    )

    expect(esito).toBe(1)
    expect(righe.join('\n')).toContain('__prova-rotte.md')
  })
})

describe('check:roadmap', () => {
  it('passa sulla roadmap vera', () => {
    const { esito, righe } = zitto(() => checkRoadmap([]))

    expect(esito).toBe(0)
    expect(righe.join('\n')).toMatch(/giornate/)
  })
})

describe('casi limite', () => {
  it("non divide per zero quando non c'è nessun file da guardare", () => {
    const { esito, righe } = zitto(() => checkComments(['--base', 'HEAD', '--head', 'HEAD']))

    expect(esito).toBe(0)
    expect(righe.join('\n')).toContain('0/0')
  })
})
