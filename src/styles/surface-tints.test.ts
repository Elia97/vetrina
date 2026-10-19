import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

// Forma eseguibile di docs/guides/ui-components.md § Modi di dire di Tailwind v4: le tinte sui ruoli.

const SRC = fileURLToPath(new URL('../', import.meta.url))
const SOURCE_FILE = /\.(?:astro|ts|tsx|mdx|css)$/
const TEST_FILE = /\.test\.ts$/
const TOKEN_SEPARATOR = /[\s'"`;,]+/
const ROLE = /--color-([a-z0-9-]+):\s*var\(--/g
const TINT = /^(?<variants>(?:\S+?:)*)bg-(?<role>[a-z0-9-]+)\/(?<alpha>\d+|\[[\d.]+%?\])!?$/
const MIX_VARIANT = /@custom-variant\s+mix\s+\(@supports\s+\(color:\s*color-mix\(in lab, red, red\)\)\);/

const globals = readFileSync(join(SRC, 'styles/globals.css'), 'utf8')
const roles = new Set([...globals.matchAll(ROLE)].map(([, role]) => role))

function percent(alpha: string): number {
  if (!alpha.startsWith('[')) return Number(alpha)
  const value = Number.parseFloat(alpha.slice(1))
  return alpha.endsWith('%]') ? value : value * 100
}

function isUnguarded(token: string): boolean {
  const groups = TINT.exec(token)?.groups
  if (groups === undefined) return false
  const { variants = '', role = '', alpha = '' } = groups
  return roles.has(role) && percent(alpha) < 50 && !variants.split(':').includes('mix')
}

function unguardedTints(path: string): string[] {
  return readFileSync(join(SRC, path), 'utf8')
    .split('\n')
    .flatMap((line, index) =>
      line
        .split(TOKEN_SEPARATOR)
        .filter(isUnguarded)
        .map((token) => `src/${path}:${index + 1} ${token}`),
    )
}

const sources = readdirSync(SRC, { recursive: true, encoding: 'utf8' }).filter(
  (path) => SOURCE_FILE.test(path) && !TEST_FILE.test(path),
)

describe('tinte di sfondo sui ruoli', () => {
  it('i ruoli si leggono da @theme inline di globals.css', () => {
    expect([...roles]).toEqual(expect.arrayContaining(['foreground', 'muted']))
  })

  it('globals.css dichiara mix: con la condizione del fallback di Tailwind', () => {
    expect(globals).toMatch(MIX_VARIANT)
  })

  it('ogni tinta sotto il 50% su un ruolo sta dietro mix:', () => {
    expect(sources.flatMap(unguardedTints)).toEqual([])
  })
})
