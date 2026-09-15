import { describe, expect, it, vi } from 'vitest'

import { DEFAULT_LOCALE } from '@/lib/site'

import { applySegmentMap, canonicalizePath, translatePath } from '@/i18n/route-segments'

vi.mock('@/i18n/segments-by-locale', () => import('@test/helpers/second-locale').then((m) => m.translatedSegments))

const SAMPLE = { contatti: 'contact', preventivo: 'quote' }

describe('applySegmentMap', () => {
  it('translates the first segment only', () => {
    expect(applySegmentMap('/contatti', SAMPLE)).toBe('/contact')
    expect(applySegmentMap('/contatti/vendite', SAMPLE)).toBe('/contact/vendite')
  })

  it('keeps unmapped segments and nested occurrences as authored', () => {
    expect(applySegmentMap('/chi-siamo', SAMPLE)).toBe('/chi-siamo')
    expect(applySegmentMap('/blog/contatti', SAMPLE)).toBe('/blog/contatti')
  })

  it('leaves the root path untouched', () => {
    expect(applySegmentMap('/', SAMPLE)).toBe('/')
  })
})

describe('translatePath / canonicalizePath', () => {
  it('riscrivono il primo segmento della lingua che ha una mappa, nei due versi', () => {
    expect(translatePath('/contatti', 'en')).toBe('/contact')
    expect(canonicalizePath('/contact', 'en')).toBe('/contatti')
  })

  it('portano con sé il resto del percorso', () => {
    expect(translatePath('/contatti/sales', 'en')).toBe('/contact/sales')
    expect(canonicalizePath('/contact/sales', 'en')).toBe('/contatti/sales')
  })

  it("lasciano com'è un segmento che la mappa non nomina", () => {
    expect(translatePath('/about', 'en')).toBe('/about')
    expect(canonicalizePath('/about', 'en')).toBe('/about')
  })

  it("sono l'identità nella lingua di default, che non ha una mappa", () => {
    expect(translatePath('/contatti', DEFAULT_LOCALE)).toBe('/contatti')
    expect(canonicalizePath('/contatti', DEFAULT_LOCALE)).toBe('/contatti')
  })
})
