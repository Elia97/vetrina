import { existsSync } from 'node:fs'
import { join } from 'node:path'
import process from 'node:process'
import { ICON_SPECS } from '@elia97/officina'
import { describe, expect, it } from 'vitest'

import { buildWebManifest } from '@/lib/seo/manifest'
import { SITE } from '@/lib/site'

const manifest = buildWebManifest()

// La cwd di vitest è la radice del progetto, e `public/` è una cartella di primo livello fissa.
const publicFile = (src: string) => join(process.cwd(), 'public', src)

describe('web manifest', () => {
  // Un'icona dichiarata ma mancante è un 404 che il browser segnala solo al momento dell'installazione.
  it('declares only icons that exist in public/', () => {
    expect(manifest.icons.length).toBeGreaterThan(0)
    for (const icon of manifest.icons) {
      expect(existsSync(publicFile(icon.src)), icon.src).toBe(true)
    }
  })

  it('takes its identity from SITE, so the install can not drift from the site', () => {
    expect(manifest.name).toBe(SITE.name)
    expect(manifest.short_name).toBe(SITE.name)
    expect(manifest.description).toBe(SITE.description)
  })

  it('pins the app identity and the navigation scope at the root', () => {
    expect(manifest.id).toBe('/')
    expect(manifest.start_url).toBe('/')
    expect(manifest.scope).toBe('/')
  })

  it('carries the light theme colour, the state an install starts from', () => {
    expect(manifest.theme_color).toBe(SITE.themeColor.light)
    expect(manifest.background_color).toBe(SITE.themeColor.light)
  })

  it('serializes to JSON, since that is how it is served', () => {
    expect(() => JSON.stringify(manifest)).not.toThrow()
    expect(JSON.parse(JSON.stringify(manifest)).icons).toHaveLength(manifest.icons.length)
  })
})

describe('SITE.themeColor', () => {
  it('is hex on both themes', () => {
    expect(SITE.themeColor.light).toMatch(/^#[0-9a-f]{6}$/)
    expect(SITE.themeColor.dark).toMatch(/^#[0-9a-f]{6}$/)
  })
})

describe('le specifiche e il manifest', () => {
  const declared = manifest.icons

  it('ogni icona generata è dichiarata in ICONS, con misure, tipo e purpose', () => {
    for (const spec of ICON_SPECS) {
      expect(declared).toContainEqual({
        src: `/${spec.file}`,
        sizes: `${spec.size}x${spec.size}`,
        type: 'image/png',
        purpose: spec.purpose,
      })
    }
  })

  it('ogni PNG dichiarato in ICONS ha la sua specifica', () => {
    const generated = ICON_SPECS.map((spec) => `/${spec.file}`)

    for (const icon of declared.filter(({ type }) => type === 'image/png')) expect(generated).toContain(icon.src)
  })
})
