import { cleanupRoots, makeRoot, read } from '@test/helpers/gen-fixture'
import { afterEach, describe, expect, it } from 'vitest'

import { injectSection } from './inject-section.mjs'

const BARREL = 'src/lib/schemas/homepage/index.ts'
const DATA = 'src/lib/homepage.ts'
const PAGE = 'src/pages/index.astro'

const FEATURES = { camel: 'features', kebab: 'features', pascal: 'Features' }
const GALLERY = { camel: 'gallery', kebab: 'gallery', pascal: 'Gallery' }

const BARREL_WITHOUT_CONTEXT = [
  "import { z } from 'astro/zod'",
  "import { heroSectionSchema } from './hero'",
  'export function homepageCollectionSchema() {',
  "  return z.discriminatedUnion('section', [heroSectionSchema()])",
  '}',
].join('\n')

const inject = (root: string) => injectSection({ root, ...FEATURES })

afterEach(cleanupRoots)

describe('injectSection', () => {
  it('registers the schema in the barrel', () => {
    const root = makeRoot()

    inject(root)

    expect(read(root, BARREL)).toMatch(/import \{ featuresSectionSchema \} from ["']\.\/features["']/)
    expect(read(root, BARREL)).toContain('featuresSectionSchema()')
  })

  it('registers the pick in getHomepageSections', () => {
    const root = makeRoot()

    inject(root)

    expect(read(root, DATA)).toContain("features: pick('features')")
  })

  it('imports the component and renders it in index.astro', () => {
    const root = makeRoot()

    inject(root)

    expect(read(root, PAGE)).toContain("import Features from '@/components/home/features.astro'")
    expect(read(root, PAGE)).toContain('<Features {...content.features} />')
  })
})

describe("una sezione con l'immagine", () => {
  it('riceve il contesto che la funzione del barrel già dichiara', () => {
    const root = makeRoot()

    injectSection({ root, ...GALLERY, image: true })

    expect(read(root, BARREL)).toContain('gallerySectionSchema(context)')
  })

  it('aggiunge al barrel il parametro e il suo tipo quando mancano, una volta sola', () => {
    const root = makeRoot({ [BARREL]: BARREL_WITHOUT_CONTEXT })

    injectSection({ root, ...GALLERY, image: true })
    injectSection({ root, ...FEATURES, image: true })

    const barrel = read(root, BARREL)
    expect(barrel.match(/context: SchemaContext/g)).toHaveLength(1)
    expect(barrel.match(/import type \{ SchemaContext \} from ["']astro:content["']/g)).toHaveLength(1)
    expect(barrel).toContain('featuresSectionSchema(context)')
  })

  it('non importa di nuovo il tipo che il barrel importa già', () => {
    const root = makeRoot({ [BARREL]: `import type { SchemaContext } from 'astro:content'\n${BARREL_WITHOUT_CONTEXT}` })

    injectSection({ root, ...GALLERY, image: true })

    expect(read(root, BARREL).match(/\{ SchemaContext \}/g)).toHaveLength(1)
  })
})

describe('insertion position relative to the markers', () => {
  it.each([
    ["import Features from '@/components/home/features.astro'", '// @gen:home-imports'],
    ['<Features {...content.features} />', '{/* @gen:home-sections */}'],
  ])('puts %s above its marker', (inserted, marker) => {
    const root = makeRoot()

    inject(root)

    const src = read(root, PAGE)
    expect(src.indexOf(inserted)).toBeGreaterThan(-1)
    expect(src.indexOf(inserted)).toBeLessThan(src.indexOf(marker))
  })

  it('keeps the markers, so the page stays injectable a second time', () => {
    const root = makeRoot()

    inject(root)

    expect(read(root, PAGE)).toContain('// @gen:home-imports')
    expect(read(root, PAGE)).toContain('{/* @gen:home-sections */}')
  })
})

describe('re-running against its own output', () => {
  it.each([
    ['the schema import', BARREL, /import \{ featuresSectionSchema \}/g],
    ['the union member', BARREL, /featuresSectionSchema\(\)/g],
    ['the pick', DATA, /features: pick\('features'\)/g],
    ['the component import', PAGE, /import Features from/g],
    ['the component usage', PAGE, /<Features \{\.\.\.content\.features\} \/>/g],
  ])('does not duplicate %s', (_what, file, pattern) => {
    const root = makeRoot()

    inject(root)
    inject(root)

    expect(read(root, file).match(pattern)).toHaveLength(1)
  })
})
