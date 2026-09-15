import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import sharp from 'sharp'

export interface IconSpec {
  file: string
  size: number
  purpose: 'any' | 'maskable'
}

// Il launcher ritaglia la maskable: resta intatto solo il cerchio centrale di diametro pari all'80%
// del lato (W3C Web App Manifest, `purpose`), e il glifo sta nel quadrato inscritto in quel cerchio.
const MASKABLE_GLYPH_SCALE = 0.8 / Math.SQRT2

export const ICON_SPECS: readonly IconSpec[] = [
  { file: 'icon-192.png', size: 192, purpose: 'any' },
  { file: 'icon-512.png', size: 512, purpose: 'any' },
  { file: 'icon-maskable-512.png', size: 512, purpose: 'maskable' },
]

async function rasterize(svg: Buffer, side: number): Promise<Buffer> {
  const { width } = await sharp(svg).metadata()
  return sharp(svg, { density: (72 * side) / width })
    .resize(side, side, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer()
}

export async function renderIcon(svg: Buffer, spec: IconSpec, background: string): Promise<Buffer> {
  const glyphSide = Math.round(spec.purpose === 'maskable' ? spec.size * MASKABLE_GLYPH_SCALE : spec.size)
  return sharp({ create: { width: spec.size, height: spec.size, channels: 4, background } })
    .composite([{ input: await rasterize(svg, glyphSide), gravity: 'centre' }])
    .png()
    .toBuffer()
}

export async function writeIcons(root: string, background: string): Promise<{ path: string; bytes: number }[]> {
  const svg = readFileSync(join(root, 'public', 'favicon.svg'))
  const written: { path: string; bytes: number }[] = []
  for (const spec of ICON_SPECS) {
    const path = `public/${spec.file}`
    const png = await renderIcon(svg, spec, background)
    writeFileSync(join(root, path), png)
    written.push({ path, bytes: png.length })
  }
  return written
}
