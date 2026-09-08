import { readFileSync } from 'node:fs'

export type Oklch = readonly [l: number, c: number, h: number]

const styles = (file: string) => readFileSync(new URL(`../../src/styles/${file}`, import.meta.url), 'utf8')

/** Le primitive di tokens.css: `--neutral-50: oklch(0.985 0 0)` e simili. */
export function primitives(): Record<string, Oklch> {
  const found: Record<string, Oklch> = {}
  for (const [, name, l, c, h] of styles('tokens.css').matchAll(
    /--([\w-]+):\s*oklch\(([\d.]+)\s+([\d.]+)\s+([\d.]+)\)/g,
  )) {
    found[String(name)] = [Number(l), Number(c), Number(h)]
  }
  return found
}

/** I ruoli semantici di un tema, risolti sulla primitiva che ognuno nomina. */
export function roles(file: string, palette: Record<string, Oklch>): Record<string, Oklch> {
  const found: Record<string, Oklch> = {}
  for (const [, role, primitive] of styles(file).matchAll(/--([\w-]+):\s*var\(--([\w-]+)\)/g)) {
    const value = palette[String(primitive)]
    if (value) found[String(role)] = value
  }
  return found
}

export function role(theme: Record<string, Oklch>, name: string): Oklch {
  const value = theme[name]
  if (!value) throw new Error(`--${name} non è definito in questo tema`)
  return value
}

// oklch → Oklab → LMS → sRGB lineare, secondo la specifica CSS Color 4.
function linearRgb([l, c, hDeg]: Oklch): readonly [number, number, number] {
  const h = (hDeg * Math.PI) / 180
  const a = c * Math.cos(h)
  const b = c * Math.sin(h)
  const long = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const medium = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const short = (l - 0.0894841775 * a - 1.291485548 * b) ** 3
  const channels = [
    4.0767416621 * long - 3.3077115913 * medium + 0.2309699292 * short,
    -1.2684380046 * long + 2.6097574011 * medium - 0.3413193965 * short,
    -0.0041960863 * long - 0.7034186147 * medium + 1.707614701 * short,
  ].map((channel) => Math.min(1, Math.max(0, channel)))
  return [channels[0] ?? 0, channels[1] ?? 0, channels[2] ?? 0]
}

/** Luminanza relativa WCAG 2.x: pesa i canali lineari, non `Y = L³`, che sbaglia su ogni rosso. */
function luminance(color: Oklch): number {
  const [r, g, b] = linearRgb(color)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

export function ratio(a: Oklch, b: Oklch): number {
  const [high, low] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return ((high ?? 0) + 0.05) / ((low ?? 0) + 0.05)
}

// Il trasferimento sRGB, che luminance() non applica: i canali lineari vanno gamma-codificati
// prima di diventare byte.
const encode = (channel: number) => (channel <= 0.0031308 ? 12.92 * channel : 1.055 * channel ** (1 / 2.4) - 0.055)

/** L'esadecimale a sei cifre che `<meta name="theme-color">` sa leggere. */
export function hex(color: Oklch): string {
  const bytes = linearRgb(color).map((channel) => Math.round(encode(channel) * 255))
  return `#${bytes.map((byte) => byte.toString(16).padStart(2, '0')).join('')}`
}
