import { afterEach, describe, expect, it, vi } from 'vitest'

import { createLastmodResolver, type GitRunner, lastmodSources, runGit, withLastmod } from '@/lib/seo/sitemap-lastmod'

const SITE_URL = 'https://example.com'
const DATE = '2026-09-15T20:58:12+02:00'

function fakeGit({ shallow = 'false', log = DATE }: { shallow?: string; log?: string } = {}) {
  const calls: string[][] = []
  const run: GitRunner = (args) => {
    calls.push([...args])
    return args[0] === 'rev-parse' ? `${shallow}\n` : `${log}\n`
  }
  return { run, calls }
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('lastmodSources', () => {
  it('lega la homepage alla pagina e ai suoi contenuti, contatti e termini al loro .astro', () => {
    expect(lastmodSources('/')).toEqual(['src/pages/index.astro', 'src/content/homepage'])
    expect(lastmodSources('/contatti')).toEqual(['src/pages/contatti.astro'])
    expect(lastmodSources('/termini')).toEqual(['src/pages/termini.astro'])
  })

  it('non ha file per le pagine servite da iubenda', () => {
    expect(lastmodSources('/privacy')).toBeUndefined()
    expect(lastmodSources('/cookie-policy')).toBeUndefined()
  })
})

describe('createLastmodResolver', () => {
  it("data una pagina con l'ultimo commit fra i suoi file, anche con lo slash finale dell'integrazione", () => {
    const { run, calls } = fakeGit()
    const resolve = createLastmodResolver(lastmodSources, run)

    expect(resolve(`${SITE_URL}/`)).toBe(DATE)
    expect(resolve(`${SITE_URL}/contatti/`)).toBe(DATE)
    expect(calls).toEqual([
      ['rev-parse', '--is-shallow-repository'],
      ['log', '-1', '--format=%cI', '--', 'src/pages/index.astro', 'src/content/homepage'],
      ['log', '-1', '--format=%cI', '--', 'src/pages/contatti.astro'],
    ])
  })

  it('non data le pagine senza file, e per loro non interroga la storia', () => {
    const { run, calls } = fakeGit()

    expect(createLastmodResolver(lastmodSources, run)(`${SITE_URL}/privacy/`)).toBeUndefined()
    expect(calls.filter(([command]) => command === 'log')).toEqual([])
  })

  it('non data una pagina i cui file non hanno ancora un commit', () => {
    expect(createLastmodResolver(lastmodSources, fakeGit({ log: '' }).run)(`${SITE_URL}/termini/`)).toBeUndefined()
  })

  it('in un clone shallow non data niente, e lo avvisa una volta sola', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const resolve = createLastmodResolver(lastmodSources, fakeGit({ shallow: 'true' }).run)

    expect(resolve(`${SITE_URL}/`)).toBeUndefined()
    expect(resolve(`${SITE_URL}/contatti/`)).toBeUndefined()
    expect(warn).toHaveBeenCalledTimes(1)
  })

  it('senza git non data niente, e nell’avviso riporta il motivo', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const resolve = createLastmodResolver(lastmodSources, () => {
      throw new Error('spawnSync git ENOENT')
    })

    expect(resolve(`${SITE_URL}/`)).toBeUndefined()
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('spawnSync git ENOENT'))
  })

  it('di default usa i file del template e la storia vera', () => {
    expect(createLastmodResolver()(`${SITE_URL}/privacy/`)).toBeUndefined()
  })
})

describe('runGit', () => {
  it("esegue git e ne restituisce l'output", () => {
    expect(runGit(['--version'])).toMatch(/^git version/)
  })
})

describe('withLastmod', () => {
  it('aggiunge lastmod alla voce che ha una data', () => {
    expect(withLastmod(() => DATE)({ url: `${SITE_URL}/contatti/` })).toEqual({
      url: `${SITE_URL}/contatti/`,
      lastmod: DATE,
    })
  })

  it('lascia intatta la voce senza data, senza la chiave lastmod', () => {
    const item = { url: `${SITE_URL}/privacy/` }

    const serialized = withLastmod(() => undefined)(item)

    expect(serialized).toBe(item)
    expect('lastmod' in serialized).toBe(false)
  })
})
