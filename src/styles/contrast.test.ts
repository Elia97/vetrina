import { describe, expect, it } from 'vitest'

import { type Oklch, primitives, ratio, roles } from '../../test/helpers/css-tokens.ts'

// Forma eseguibile di docs/guides/ui-components.md § Contrasto.

const palette = primitives()
const light = roles('light.css', palette)
// Il tema scuro ridefinisce solo una parte dell'insieme; il resto eredita da :root.
const dark = { ...light, ...roles('dark.css', palette) }
const themes = [
  ['light', light],
  ['dark', dark],
] as const

// WCAG 1.4.3, testo normale.
const TEXT_PAIRS = [
  ['foreground', 'background'],
  ['foreground', 'card'],
  ['muted-foreground', 'background'],
  ['muted-foreground', 'card'],
  ['popover-foreground', 'popover'],
  ['primary-foreground', 'primary'],
  ['secondary-foreground', 'secondary'],
  ['accent-foreground', 'accent'],
  // I due ruoli dello stesso token: l'errore di form è `text-destructive`, il bottone è
  // `bg-destructive` con sopra `--destructive-foreground`.
  ['destructive', 'background'],
  ['destructive', 'card'],
  ['destructive-foreground', 'destructive'],
  ['success', 'background'],
  ['success', 'card'],
] as const

// WCAG 1.4.11, confini di un componente di interfaccia.
const UI_PAIRS = [
  ['input', 'background'],
  // Il form di contatto sta dentro una Card, che è la più stretta delle due.
  ['input', 'card'],
  ['ring', 'background'],
  ['ring', 'card'],
] as const

describe.each(themes)('%s theme', (_name, tokens) => {
  it.each(TEXT_PAIRS)('%s on %s clears 4.5:1', (fg, bg) => {
    const pair = [tokens[fg], tokens[bg]] as const
    expect(pair[0], `--${fg} is not mapped`).toBeDefined()
    expect(pair[1], `--${bg} is not mapped`).toBeDefined()
    expect(ratio(pair[0] as Oklch, pair[1] as Oklch)).toBeGreaterThanOrEqual(4.5)
  })

  it.each(UI_PAIRS)('%s on %s clears 3:1', (fg, bg) => {
    const pair = [tokens[fg], tokens[bg]] as const
    expect(ratio(pair[0] as Oklch, pair[1] as Oklch)).toBeGreaterThanOrEqual(3)
  })
})
