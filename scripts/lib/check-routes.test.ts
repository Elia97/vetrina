import { describe, expect, it } from 'vitest'

import { findingsFor, headings, isScanned, normalizeTitle, resolveTarget } from './check-routes.ts'

describe('isScanned', () => {
  it.each([
    ['docs/ARCHITECTURE.md', true],
    ['CLAUDE.md', true],
    ['src/lib/site.ts', false],
    ['docs/sources/brief.md', false],
    ['docs/stima.pdf', false],
  ])('%s → %s', (path, expected) => {
    expect(isScanned(path)).toBe(expected)
  })
})

describe('normalizeTitle', () => {
  it('toglie la formattatura che la prosa porta con sé', () => {
    expect(normalizeTitle('**I domini**')).toBe('i domini')
    expect(normalizeTitle('  `Struttura` del repository ')).toBe('struttura del repository')
  })
})

describe('headings', () => {
  it('prende i titoli dal secondo livello in giù, non il nome del documento', () => {
    const doc = '# Documento\n## Primo\ntesto\n### Secondo\n#### Terzo\n##### Quarto\n'

    expect(headings(doc)).toEqual(['primo', 'secondo', 'terzo'])
  })
})

describe('resolveTarget', () => {
  it('lascia stare un percorso completo', () => {
    expect(resolveTarget('CLAUDE.md', 'docs/ARCHITECTURE.md')).toBe('docs/ARCHITECTURE.md')
  })

  it('risolve un nome nudo contro la cartella di chi cita', () => {
    expect(resolveTarget('docs/guides/seo.md', 'deploy-ops.md')).toBe('docs/guides/deploy-ops.md')
  })

  it("lascia il nome com'è quando non esiste nessun fratello", () => {
    expect(resolveTarget('docs/guides/seo.md', 'inesistente.md')).toBe('inesistente.md')
  })
})

describe('findingsFor', () => {
  it('non dice niente su un percorso che esiste', () => {
    expect(findingsFor('prova.md', 'vedi `docs/ARCHITECTURE.md` per il resto')).toEqual([])
  })

  it('segnala un percorso che non esiste, con la sua riga', () => {
    const doc = 'prima riga\nvedi `src/lib/inventato.ts` e poi basta\n'

    expect(findingsFor('prova.md', doc)).toEqual([
      { line: 2, message: 'percorso che non esiste: src/lib/inventato.ts' },
    ])
  })

  it('tace sui percorsi non tracciati per scelta e sui glob', () => {
    const doc = 'in `.claude/plans/stato.md`, in `docs/stima.pdf` e in `docs/guides/*.md`'

    expect(findingsFor('prova.md', doc)).toEqual([])
  })

  it('accetta il titolo per intero', () => {
    expect(findingsFor('prova.md', 'vedi `docs/ARCHITECTURE.md` § Struttura del repository')).toEqual([])
  })

  it('rifiuta un titolo accorciato: un prefisso accetterebbe anche una lettera sola', () => {
    expect(findingsFor('prova.md', 'vedi `docs/ARCHITECTURE.md` § Struttura')).toHaveLength(1)
  })

  it('segnala una sezione che non esiste', () => {
    const finding = findingsFor('prova.md', 'vedi `docs/ARCHITECTURE.md` § Sezione Inventata')

    expect(finding).toHaveLength(1)
    expect(finding[0]?.message).toContain('sezione che non esiste')
  })

  it('segnala una sezione dentro un file che non esiste', () => {
    const finding = findingsFor('prova.md', 'vedi `inventato.md` § Qualcosa')

    expect(finding).toEqual([{ line: 1, message: 'sezione in un file che non esiste: inventato.md' }])
  })

  it('un file citato per percorso e per sezione è un difetto solo', () => {
    const finding = findingsFor('prova.md', 'vedi `docs/inventato.md` § Qualcosa')

    expect(finding).toEqual([{ line: 1, message: 'percorso che non esiste: docs/inventato.md' }])
  })

  // I percorsi si cercano tutti prima delle sezioni, quindi senza riordino un difetto di riga 1
  // finirebbe stampato dopo uno di riga 3.
  it("riporta i difetti nell'ordine delle righe", () => {
    const doc = 'vedi `docs/ARCHITECTURE.md` § Sezione Inventata\n\nvedi `src/lib/inventato.ts`\n'

    expect(findingsFor('prova.md', doc).map((f) => f.line)).toEqual([1, 3])
  })

  it('la prosa dopo il titolo non entra nel titolo', () => {
    const doc = 'vedi `docs/ARCHITECTURE.md` § Struttura del repository, che etichetta i percorsi'

    expect(findingsFor('prova.md', doc)).toEqual([])
  })
})
