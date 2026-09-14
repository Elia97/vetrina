import { describe, expect, it } from 'vitest'

import { hex, primitives, role, roles } from '../../test/helpers/css-tokens.ts'
import { SITE } from '../lib/site.ts'

const palette = primitives()
const light = roles('light.css', palette)
const dark = { ...light, ...roles('dark.css', palette) }

describe('SITE.themeColor', () => {
  it.each([
    ['light', light],
    ['dark', dark],
  ] as const)('è il --background del tema %s', (name, tokens) => {
    expect(hex(role(tokens, 'background'))).toBe(SITE.themeColor[name])
  })
})
