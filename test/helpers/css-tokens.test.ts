import { describe, expect, it } from 'vitest'

import { hex, type Oklch, role } from './css-tokens.ts'

// I primi cinque di https://www.w3.org/TR/css-color-4/#ex-oklch-samples; ogni rgb() è nello `style` del suo swatch.
const SPEC_SAMPLES: [Oklch, [number, number, number]][] = [
  [
    [0.40101, 0.12332, 21.555],
    [49.06, 13.87, 15.9],
  ],
  [
    [0.59686, 0.15619, 49.7694],
    [77.61, 36.34, 2.45],
  ],
  [
    [0.65125, 0.13138, 104.097],
    [61.65, 57.51, 9.28],
  ],
  [
    [0.66016, 0.15546, 134.231],
    [40.73, 65.12, 22.35],
  ],
  [
    [0.72322, 0.12403, 247.996],
    [38.29, 67.27, 93.85],
  ],
]

const channels = (value: string) => [1, 3, 5].map((start) => Number.parseInt(value.slice(start, start + 2), 16) / 255)

describe('hex', () => {
  it.each(SPEC_SAMPLES)('porta oklch %j sul rgb() della specifica', (color, percentages) => {
    expect(channels(hex(color))).toEqual(percentages.map((percentage) => expect.closeTo(percentage / 100, 2)))
  })
})

describe('role', () => {
  it('nomina il foglio in cui il ruolo non si risolve', () => {
    expect(() => role({}, 'background', 'dark.css')).toThrow('src/styles/dark.css')
  })
})
