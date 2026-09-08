import { execFileSync } from 'node:child_process'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { changedFiles, trackedAndUntracked } from './git.ts'

const sha = (ref: string) => execFileSync('git', ['rev-parse', ref], { encoding: 'utf8' }).trim()

const cartelle: string[] = []

afterEach(() => {
  vi.unstubAllEnvs()
  for (const cartella of cartelle.splice(0)) rmSync(cartella, { recursive: true, force: true })
})

// Scrive l'evento che GitHub Actions passa al job: è l'unico modo di percorrere il ramo delle
// pull request, che in locale non si attiva mai.
const eventoPullRequest = (base: string, head: string): string => {
  const cartella = mkdtempSync(join(tmpdir(), 'evento-'))
  cartelle.push(cartella)
  const file = join(cartella, 'event.json')
  writeFileSync(
    file,
    JSON.stringify({
      pull_request: { base: { sha: base }, head: { sha: head } },
    }),
  )
  return file
}

describe('trackedAndUntracked', () => {
  it('elenca i file del repository con i percorsi che esistono davvero', () => {
    const files = trackedAndUntracked()
    expect(files).toContain('package.json')
    expect(files).toContain('scripts/lib/git.ts')
  })
})

describe('changedFiles', () => {
  it('con una base esplicita guarda il diff da lì a HEAD', () => {
    const files = changedFiles({ base: 'HEAD~1', head: 'HEAD' })
    expect(Array.isArray(files)).toBe(true)
  })

  it('senza head include anche le modifiche non ancora committate', () => {
    const soloCommit = changedFiles({ base: 'HEAD~1', head: 'HEAD' })
    const conLavoro = changedFiles({ base: 'HEAD~1' })
    expect(conLavoro.length).toBeGreaterThanOrEqual(soloCommit.length)
  })

  it('non ripete un file che risulta cambiato da più elenchi', () => {
    const files = changedFiles({ base: 'HEAD~2' })
    expect(new Set(files).size).toBe(files.length)
  })

  it("sulle pull request usa gli sha dell'evento, non i branch locali", () => {
    vi.stubEnv('GITHUB_EVENT_NAME', 'pull_request')
    vi.stubEnv('GITHUB_EVENT_PATH', eventoPullRequest(sha('HEAD~1'), sha('HEAD')))

    expect(changedFiles({})).toEqual(changedFiles({ base: sha('HEAD~1'), head: sha('HEAD') }))
  })

  it('una base esplicita ha la precedenza sugli sha della pull request', () => {
    vi.stubEnv('GITHUB_EVENT_NAME', 'pull_request')
    vi.stubEnv('GITHUB_EVENT_PATH', eventoPullRequest(sha('HEAD~2'), sha('HEAD')))

    expect(changedFiles({ base: 'HEAD~1', head: 'HEAD' })).toEqual(changedFiles({ base: 'HEAD~1', head: 'HEAD' }))
  })

  it('ignora un evento che non descrive una pull request', () => {
    vi.stubEnv('GITHUB_EVENT_NAME', 'push')
    vi.stubEnv('GITHUB_EVENT_PATH', eventoPullRequest(sha('HEAD~1'), sha('HEAD')))

    expect(() => changedFiles({})).not.toThrow()
  })

  // Senza remote il fetch di ripiego fallisce, ed è il caso che porta a galla il messaggio di
  // git invece di un errore generico: senza, chi legge non sa che il ref non esiste.
  it("riporta l'errore di git quando il riferimento non esiste", () => {
    expect(() => changedFiles({ base: 'riferimento-che-non-esiste-da-nessuna-parte' })).toThrow()
  })

  it('ignora un evento di pull request privo degli sha', () => {
    const cartella = mkdtempSync(join(tmpdir(), 'evento-'))
    cartelle.push(cartella)
    const file = join(cartella, 'event.json')
    writeFileSync(file, JSON.stringify({ pull_request: { base: {} } }))

    vi.stubEnv('GITHUB_EVENT_NAME', 'pull_request')
    vi.stubEnv('GITHUB_EVENT_PATH', file)

    expect(() => changedFiles({})).not.toThrow()
  })
})

// defaultBase() non si percorre dal repository di lavoro, che ha sempre un `origin/HEAD`: serve
// un repo appena creato, dove la base va cercata fra i candidati o non esiste affatto.
describe('defaultBase', () => {
  const partenza = process.cwd()

  afterEach(() => {
    process.chdir(partenza)
  })

  const repoTemporaneo = (conCommit: boolean): string => {
    const cartella = mkdtempSync(join(tmpdir(), 'repo-'))
    cartelle.push(cartella)
    const git = (...args: string[]) => execFileSync('git', args, { cwd: cartella })
    git('init', '--initial-branch=main')
    git('config', 'user.email', 'prova@example.com')
    git('config', 'user.name', 'Prova')
    if (conCommit) {
      writeFileSync(join(cartella, 'file.txt'), 'contenuto\n')
      git('add', '.')
      git('commit', '-m', 'chore: primo commit')
    }
    return cartella
  }

  it('senza origin/HEAD ricade sul primo candidato che esiste', () => {
    process.chdir(repoTemporaneo(true))

    expect(() => changedFiles({})).not.toThrow()
  })

  it('senza nessun candidato dice quale opzione passare', () => {
    process.chdir(repoTemporaneo(false))

    expect(() => changedFiles({})).toThrow(/--base/)
  })

  // Due radici scorrelate: i due commit esistono entrambi, quindi ensureCommit passa ed è il
  // diff a fallire — lo stesso esito di un clone shallow, che è il caso che il messaggio nomina.
  it('su due storie senza antenato comune suggerisce il clone completo', () => {
    const cartella = repoTemporaneo(true)
    process.chdir(cartella)
    const git = (...args: string[]) => execFileSync('git', args, { cwd: cartella, encoding: 'utf8' })
    git('checkout', '--orphan', 'altra-radice')
    writeFileSync(join(cartella, 'altro.txt'), 'altro\n')
    git('add', '.')
    git('commit', '-m', 'chore: radice scorrelata')

    expect(() => changedFiles({ base: 'main', head: 'altra-radice' })).toThrow(/unshallow/)
  })
})
