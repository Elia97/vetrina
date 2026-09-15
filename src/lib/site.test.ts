import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import process from 'node:process'
import { describe, expect, it } from 'vitest'

import { localeTag, SITE } from '@/lib/site'

describe('localeTag', () => {
  it('maps a configured locale to its BCP 47 tag', () => {
    expect(localeTag('it')).toBe('it-IT')
  })

  it('falls back to the code itself for a locale with no tag', () => {
    expect(localeTag('en')).toBe('en')
  })
})

describe('SITE.defaultOgImageSize', () => {
  it('coincide con le misure di public/og-default.png', () => {
    const png = readFileSync(join(process.cwd(), 'public', SITE.defaultOgImage))
    // Nel PNG larghezza e altezza sono interi big-endian a 32 bit ai byte 16 e 20, dentro l'IHDR.
    expect({ width: png.readUInt32BE(16), height: png.readUInt32BE(20) }).toEqual(SITE.defaultOgImageSize)
  })
})
