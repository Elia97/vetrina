import { readFileSync } from 'node:fs'

export type Oklch = readonly [l: number, c: number, h: number]

export const stylesheet = (file: string): string =>
  readFileSync(new URL(`../../src/styles/${file}`, import.meta.url), 'utf8')

export function utility(name: string): string {
  const css = stylesheet('globals.css')
  const start = css.indexOf(`@utility ${name} {`)
  return start === -1 ? '' : css.slice(start, css.indexOf('}', start))
}

/** Le primitive di tokens.css: `--neutral-50: oklch(0.985 0 0)` e simili. */
export function primitives(): Record<string, Oklch> {
  const found: Record<string, Oklch> = {}
  for (const [, name, l, c, h] of stylesheet('tokens.css').matchAll(
    /--([\w-]+):\s*oklch\(([\d.]+)\s+([\d.]+)\s+([\d.]+)\)/g,
  )) {
    found[String(name)] = [Number(l), Number(c), Number(h)]
  }
  return found
}

/** I ruoli semantici di un tema, risolti sulla primitiva che ognuno nomina. */
export function roles(file: string, palette: Record<string, Oklch>): Record<string, Oklch> {
  const found: Record<string, Oklch> = {}
  for (const [, role, primitive] of stylesheet(file).matchAll(/--([\w-]+):\s*var\(--([\w-]+)\)/g)) {
    const value = palette[String(primitive)]
    if (value) found[String(role)] = value
  }
  return found
}

export function role(theme: Record<string, Oklch>, name: string, file: string): Oklch {
  const value = theme[name]
  if (!value)
    throw new Error(
      `--${name} non si risolve: manca in src/styles/${file}, o la primitiva che nomina non è un oklch() di src/styles/tokens.css`,
    )
  return value
}

type Triple = readonly [number, number, number]

const each = (x: Triple, f: (value: number) => number): Triple => [f(x[0]), f(x[1]), f(x[2])]
const zip = (x: Triple, y: Triple, f: (first: number, second: number) => number): Triple => [
  f(x[0], y[0]),
  f(x[1], y[1]),
  f(x[2], y[2]),
]

function oklab([l, c, hDeg]: Oklch): Triple {
  const h = (hDeg * Math.PI) / 180
  return [l, c * Math.cos(h), c * Math.sin(h)]
}

// Le costanti sono quelle di oklab_to_linear_srgb in https://bottosson.github.io/posts/oklab/.
function linearRgb([l, a, b]: Triple): Triple {
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
const weigh = ([r, g, b]: Triple) => 0.2126 * r + 0.7152 * g + 0.0722 * b

const luminance = (color: Oklch) => weigh(linearRgb(oklab(color)))

function contrast(first: number, second: number): number {
  const [high, low] = [first, second].sort((x, y) => y - x)
  return ((high ?? 0) + 0.05) / ((low ?? 0) + 0.05)
}

export function ratio(a: Oklch, b: Oklch): number {
  return contrast(luminance(a), luminance(b))
}

// Il trasferimento sRGB, che luminance() non applica: i canali lineari vanno gamma-codificati
// prima di diventare byte.
const encode = (channel: number) => (channel <= 0.0031308 ? 12.92 * channel : 1.055 * channel ** (1 / 2.4) - 0.055)
const decode = (channel: number) => (channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4)

/** L'esadecimale a sei cifre che `<meta name="theme-color">` sa leggere. */
export function hex(color: Oklch): string {
  const bytes = linearRgb(oklab(color)).map((channel) => Math.round(encode(channel) * 255))
  return `#${bytes.map((byte) => byte.toString(16).padStart(2, '0')).join('')}`
}

export interface HoverMix {
  color: 'transparent' | 'black' | 'white'
  amount: number
}

/** `--control-hover-mix` di tokens.css, la miscela che `bg-hover-*` in globals.css dà al riempimento. */
export function controlHoverMix(css = stylesheet('tokens.css')): HoverMix {
  const [, color, percent] = css.match(/--control-hover-mix:\s*(transparent|black|white)\s+([\d.]+)%/) ?? []
  if (!color || !percent) {
    throw new Error('--control-hover-mix in src/styles/tokens.css non è transparent, black o white con una quota')
  }
  return { color: color as HoverMix['color'], amount: Number(percent) / 100 }
}

const OPAQUE_MIX: Record<Exclude<HoverMix['color'], 'transparent'>, Triple> = { black: [0, 0, 0], white: [1, 0, 0] }

// Chromium compone l'alfa sulla superficie in sRGB codificato, non in lineare: con questo passo
// il modello ridà le misure dell'hover prese nel browser.
function hoverLuminance(fill: Oklch, surface: Oklch, { color, amount }: HoverMix): number {
  const toward = (from: number, to: number) => (1 - amount) * from + amount * to
  if (color !== 'transparent') return weigh(linearRgb(zip(oklab(fill), OPAQUE_MIX[color], toward)))
  const encoded = (value: Oklch) => each(linearRgb(oklab(value)), encode)
  return weigh(each(zip(encoded(fill), encoded(surface), toward), decode))
}

export function hoverRatio(foreground: Oklch, fill: Oklch, surface: Oklch, mix: HoverMix): number {
  return contrast(luminance(foreground), hoverLuminance(fill, surface, mix))
}
