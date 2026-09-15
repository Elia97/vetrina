import type { SchemaContext } from 'astro:content'
import { z } from 'astro/zod'
import { describe, expect, it } from 'vitest'

import { homepageCollectionSchema } from '@/lib/schemas/homepage'
import { heroSectionSchema } from '@/lib/schemas/homepage/hero'

const context = { image: () => z.string().min(1) } as unknown as SchemaContext

const hero = {
  section: 'hero',
  title: 'Titolo',
  buttons: [{ label: 'Azione', url: '/contatti' }],
}

describe('heroSectionSchema', () => {
  it('accepts a well-formed section', () => {
    expect(heroSectionSchema(context).safeParse(hero).success).toBe(true)
  })

  it('accetta uno sfondo facoltativo, senza alt', () => {
    const result = heroSectionSchema(context).safeParse({ ...hero, image: { src: '/placeholder.jpg' } })
    expect(result.success).toBe(true)
  })

  it('rejects an unknown key instead of stripping it', () => {
    const result = heroSectionSchema(context).safeParse({ ...hero, subtitile: 'typo' })
    expect(result.success).toBe(false)
  })

  it('rejects an unknown key inside a nested cta', () => {
    const result = heroSectionSchema(context).safeParse({
      ...hero,
      buttons: [{ label: 'Azione', url: '/contatti', target: '_blank' }],
    })
    expect(result.success).toBe(false)
  })
})

describe('homepageCollectionSchema', () => {
  it('carries the strictness through the discriminated union', () => {
    expect(homepageCollectionSchema(context).safeParse(hero).success).toBe(true)
    expect(homepageCollectionSchema(context).safeParse({ ...hero, subtitile: 'typo' }).success).toBe(false)
  })
})
