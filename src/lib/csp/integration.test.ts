import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { cspIntegration } from '@/lib/csp/integration'

// Provato contro una directory vera invece che su un filesystem simulato: quello che questo
// hook deve azzeccare è l'attraversamento e la riscrittura, e un mock verificherebbe il mock.

let root = ''

function buildOutput(files: Record<string, string>): URL {
  root = mkdtempSync(join(tmpdir(), 'csp-'))
  for (const [name, html] of Object.entries(files)) {
    const full = join(root, name)
    mkdirSync(join(full, '..'), { recursive: true })
    writeFileSync(full, html)
  }
  return pathToFileURL(`${root}/`)
}

const read = (name: string): string => readFileSync(join(root, name), 'utf8')

function run(dir: URL): { info: ReturnType<typeof vi.fn> } {
  const info = vi.fn()
  const hook = cspIntegration().hooks['astro:build:done']
  if (!hook)
    throw new Error('the integration declares no astro:build:done hook')
    // L'hook riceve l'intero payload di Astro; qui si leggono solo `dir` e `logger`.
  ;(hook as unknown as (options: { dir: URL; logger: { info: (m: string) => void } }) => void)({
    dir,
    logger: { info },
  })
  return { info }
}

afterEach(() => {
  if (root) rmSync(root, { recursive: true, force: true })
  root = ''
  vi.unstubAllEnvs()
})

describe('cspIntegration', () => {
  it('injects the meta into every page, recursing into subdirectories', () => {
    const dir = buildOutput({
      'index.html': '<head><meta charset="utf-8"></head>',
      'nested/deep/page.html': '<head><meta charset="utf-8"></head>',
      'asset.css': 'body{}',
    })

    const { info } = run(dir)

    expect(read('index.html')).toContain('http-equiv="Content-Security-Policy"')
    expect(read('nested/deep/page.html')).toContain('http-equiv="Content-Security-Policy"')
    expect(read('asset.css')).toBe('body{}')
    expect(info).toHaveBeenCalledWith(expect.stringContaining('2/2 pages'))
  })

  it('gives every page the union of the hashes, not just its own', () => {
    // ClientRouter scambia la head, non la policy: la CSP in meta della prima pagina
    // caricata governa tutta la sessione.
    const dir = buildOutput({
      'a.html': '<head><meta charset="utf-8"><script>a=1</script></head>',
      'b.html': '<head><meta charset="utf-8"><script>b=2</script></head>',
    })

    run(dir)

    const scriptSrc = (file: string) =>
      (/content="([^"]*)"/.exec(read(file))?.[1] ?? '').split('; ').find((d) => d.startsWith('script-src')) ?? ''
    expect(scriptSrc('a.html')).toBe(scriptSrc('b.html'))
    expect(scriptSrc('a.html').match(/sha256-/g)).toHaveLength(2)
  })

  it('leaves a page it cannot anchor untouched, and does not count it', () => {
    const dir = buildOutput({ 'fragment.html': '<div>no head here</div>' })

    const { info } = run(dir)

    expect(read('fragment.html')).toBe('<div>no head here</div>')
    expect(info).toHaveBeenCalledWith(expect.stringContaining('0/1 pages'))
  })
})

describe('cspIntegration and VERCEL_ENV', () => {
  it('opens the policy to the toolbar when VERCEL_ENV is preview, and says so in the log', () => {
    vi.stubEnv('VERCEL_ENV', 'preview')
    const dir = buildOutput({ 'index.html': '<head><meta charset="utf-8"></head>' })

    const { info } = run(dir)

    expect(read('index.html')).toContain('https://vercel.live')
    expect(info).toHaveBeenCalledWith(expect.stringContaining('preview hosts'))
  })

  it('leaves the toolbar out on every other environment', () => {
    vi.stubEnv('VERCEL_ENV', 'production')
    const dir = buildOutput({ 'index.html': '<head><meta charset="utf-8"></head>' })

    const { info } = run(dir)

    expect(read('index.html')).not.toContain('https://vercel.live')
    expect(info).not.toHaveBeenCalledWith(expect.stringContaining('preview hosts'))
  })
})
