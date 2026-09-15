import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import process from 'node:process'
import sharp from 'sharp'
import { afterEach, describe, expect, it } from 'vitest'

import { buildWebManifest } from '@/lib/seo/manifest'
import { SITE } from '@/lib/site'

import { ICON_SPECS, type IconSpec, renderIcon, writeIcons } from './icons.ts'

const favicon = readFileSync(join(process.cwd(), 'public', 'favicon.svg'))
const background = SITE.themeColor.light
const roots: string[] = []

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true })
})

async function raster(spec: IconSpec) {
  const png = await renderIcon(favicon, spec, background)
  const { data, info } = await sharp(png).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  const colorAt = (x: number, y: number) => {
    const offset = (y * info.width + x) * 4
    const [r = 0, g = 0, b = 0, alpha = 0] = data.subarray(offset, offset + 4)
    return { hex: `#${[r, g, b].map((value) => value.toString(16).padStart(2, '0')).join('')}`, alpha }
  }
  const points = Array.from({ length: info.width * info.height }, (_, index) => ({
    x: index % info.width,
    y: Math.floor(index / info.width),
  }))
  return { width: info.width, height: info.height, colorAt, points }
}

describe.each(ICON_SPECS.map((spec) => [spec.file, spec] as const))('%s', (_file, spec) => {
  it('ha il lato della sua specifica', async () => {
    const { width, height } = await raster(spec)

    expect({ width, height }).toEqual({ width: spec.size, height: spec.size })
  })

  it('è opaca sul colore del tema chiaro del manifest, con il glifo sopra', async () => {
    const { width, colorAt, points } = await raster(spec)

    expect(colorAt(0, 0)).toEqual({ hex: background, alpha: 255 })
    expect(colorAt(width - 1, width - 1)).toEqual({ hex: background, alpha: 255 })
    expect(points.filter(({ x, y }) => colorAt(x, y).hex !== background).length).toBeGreaterThan(points.length / 20)
  })
})

describe('la maskable', () => {
  it('tiene il glifo dentro il cerchio della zona sicura, di diametro pari all’80% del lato', async () => {
    const spec = ICON_SPECS.find((candidate) => candidate.purpose === 'maskable')
    if (!spec) throw new Error('nessuna icona maskable fra le specifiche')
    const { width, colorAt, points } = await raster(spec)
    const center = (width - 1) / 2

    const outside = points.filter(
      ({ x, y }) => Math.hypot(x - center, y - center) > width * 0.4 && colorAt(x, y).hex !== background,
    )

    expect(outside).toEqual([])
  })
})

describe('writeIcons', () => {
  it('scrive le icone in public/ e ne riporta il peso', async () => {
    const root = mkdtempSync(join(tmpdir(), 'icons-'))
    roots.push(root)
    mkdirSync(join(root, 'public'))
    cpSync(join(process.cwd(), 'public', 'favicon.svg'), join(root, 'public', 'favicon.svg'))

    const written = await writeIcons(root, background)

    expect(written.map(({ path }) => path)).toEqual(ICON_SPECS.map((spec) => `public/${spec.file}`))
    for (const { path, bytes } of written) expect(readFileSync(join(root, path)).length).toBe(bytes)
  })
})

describe('le specifiche e il manifest', () => {
  const declared = buildWebManifest().icons

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
