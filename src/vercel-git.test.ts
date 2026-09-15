import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

type VercelConfig = {
  ignoreCommand?: string
  git?: { deploymentEnabled?: Record<string, boolean> }
}

const configUrl = new URL('../vercel.json', import.meta.url)
const config = JSON.parse(readFileSync(fileURLToPath(configUrl), 'utf8')) as VercelConfig

const SKIP_SCRIPT = 'scripts/vercel-ignore-build.sh'

describe('vercel.json ignored build step', () => {
  // Senza questa chiave il comando torna a essere un'impostazione della dashboard, che nessun
  // gate legge: dimenticarla su un fork rimette la produzione su ogni push a main.
  it('declares the skip script, so the setting travels with the repository', () => {
    expect(config.ignoreCommand).toBe(`bash ${SKIP_SCRIPT}`)
  })

  it('names a script that exists', () => {
    expect(existsSync(fileURLToPath(new URL(`../${SKIP_SCRIPT}`, import.meta.url)))).toBe(true)
  })
})

describe('vercel.json git deployments', () => {
  it('gives dependabot branches no preview deployment', () => {
    expect(config.git?.deploymentEnabled).toEqual({ 'dependabot/**': false })
  })
})
