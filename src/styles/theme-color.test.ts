import { describe, expect, it } from 'vitest'

import { hex, primitives, role, roles } from '../../test/helpers/css-tokens.ts'
import { SITE } from '../lib/site.ts'

const palette = primitives()
const light = roles('light.css', palette)
const dark = { ...light, ...roles('dark.css', palette) }

describe('SITE.themeColor', () => {
  it.each([
    ['light', light, 'light.css'],
    ['dark', dark, 'dark.css'],
  ] as const)('è il --background del tema %s', (name, tokens, file) => {
    const expected = hex(role(tokens, 'background', file))
    expect(SITE.themeColor[name], `SITE.themeColor.${name} in src/lib/site.ts: scrivici ${expected}`).toBe(expected)
  })
})
