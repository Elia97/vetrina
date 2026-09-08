import { afterEach, describe, expect, it, vi } from 'vitest'

import { cliOptions, exitCode, isGenerated, printFindings, readLines } from './cli.ts'

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllEnvs()
})

const righeStampate = (fn: () => void): string[] => {
  const righe: string[] = []
  vi.spyOn(console, 'log').mockImplementation((riga: string) => {
    righe.push(riga)
  })
  fn()
  return righe
}

describe('cliOptions', () => {
  it('parte dai default quando non riceve argomenti', () => {
    expect(cliOptions([])).toMatchObject({
      diff: false,
      strict: false,
      format: 'text',
    })
  })

  it('--base implica --diff: chiedere una base è chiedere un confronto', () => {
    expect(cliOptions(['--base', 'main'])).toMatchObject({
      base: 'main',
      diff: true,
    })
  })

  it('sceglie il formato annotazioni quando gira dentro GitHub Actions', () => {
    vi.stubEnv('GITHUB_ACTIONS', 'true')
    expect(cliOptions([]).format).toBe('github')
  })

  it("un formato esplicito vince sull'ambiente", () => {
    vi.stubEnv('GITHUB_ACTIONS', 'true')
    expect(cliOptions(['--format', 'text']).format).toBe('text')
  })
})

describe('isGenerated', () => {
  it.each(['src/routeTree.gen.ts', 'src/schema.gen.tsx', 'src/api.gen.mts'])('%s è generato', (path) => {
    expect(isGenerated(path)).toBe(true)
  })

  it.each(['src/generated.ts', 'src/gen.ts', 'src/routeTree.gen.ts.bak'])('%s non lo è', (path) => {
    expect(isGenerated(path)).toBe(false)
  })
})

describe('exitCode', () => {
  const errore = {
    path: 'a.ts',
    message: 'x',
    severity: 'error' as const,
  }
  const avviso = { path: 'a.ts', message: 'x', severity: 'warning' as const }

  it('esce 1 sugli errori, sempre', () => {
    expect(exitCode([errore], false)).toBe(1)
  })

  it('gli avvisi bloccano solo con --strict', () => {
    expect(exitCode([avviso], false)).toBe(0)
    expect(exitCode([avviso], true)).toBe(1)
  })

  it('nessun ritrovamento, nessun errore', () => {
    expect(exitCode([], true)).toBe(0)
  })
})

describe('printFindings', () => {
  const finding = {
    path: 'src/a.ts',
    line: 12,
    message: 'commento troppo lungo',
    severity: 'error' as const,
  }

  it('in formato testo mostra percorso, riga e messaggio', () => {
    const [riga] = righeStampate(() => printFindings([finding], 'text'))
    expect(riga).toContain('src/a.ts:12')
    expect(riga).toContain('commento troppo lungo')
  })

  it('omette la riga quando il ritrovamento riguarda il file intero', () => {
    const { line: _riga, ...senzaRiga } = finding
    const [riga] = righeStampate(() => printFindings([senzaRiga], 'text'))
    expect(riga).toContain('src/a.ts:')
    expect(riga).not.toMatch(/src\/a\.ts:\d/)
  })

  it('in formato github emette un comando di annotazione', () => {
    const [riga] = righeStampate(() => printFindings([finding], 'github'))
    expect(riga).toBe('::error file=src/a.ts,line=12::commento troppo lungo')
  })

  it('in github omette il parametro line quando il ritrovamento è sul file', () => {
    const { line: _riga, ...senzaRiga } = finding
    const [riga] = righeStampate(() => printFindings([senzaRiga], 'github'))
    expect(riga).toBe('::error file=src/a.ts::commento troppo lungo')
  })

  it('distingue gli avvisi dagli errori con un segno diverso', () => {
    const avviso = { ...finding, severity: 'warning' as const }
    const [riga] = righeStampate(() => printFindings([avviso], 'text'))
    expect(riga).toContain('·')
    expect(riga).not.toContain('✗')
  })

  it('codifica i caratteri che romperebbero il comando di annotazione', () => {
    const [riga] = righeStampate(() => printFindings([{ ...finding, message: 'prima\nseconda 50% in più' }], 'github'))
    expect(riga).toContain('prima%0Aseconda 50%25 in più')
  })
})

describe('readLines', () => {
  it('numera da uno e non inventa una riga finale', () => {
    expect(readLines('a\nb\n')).toEqual([
      { n: 1, text: 'a' },
      { n: 2, text: 'b' },
    ])
  })
})
