import type { ImageFunction } from 'astro:content'
import { z } from 'astro/zod'
import { describe, expect, it } from 'vitest'

import { backgroundSchema, ctaSchema, imageSchema } from '@/lib/schemas/common'

const image = (() => z.string().min(1)) as unknown as ImageFunction

function parseUrl(url: string): boolean {
  return ctaSchema.safeParse({ label: 'Azione', url }).success
}

describe('ctaSchema url', () => {
  it.each([
    '/contatti',
    '/',
    '#servizi',
    'https://example.com',
    'http://example.com',
    'mailto:a@example.com',
    'tel:+390123456',
  ])('accepts %s', (url) => {
    expect(parseUrl(url)).toBe(true)
  })

  it.each(['javascript:alert(1)', 'data:text/html,<script>alert(1)</script>', '//evil.example/phish'])(
    'rejects %s',
    (url) => {
      expect(parseUrl(url)).toBe(false)
    },
  )

  it('rejects an empty url', () => {
    expect(parseUrl('')).toBe(false)
  })
})

describe('imageSchema', () => {
  const schema = imageSchema(image)

  it("accetta un alt vuoto, che per un'immagine decorativa è la scelta di chi scrive", () => {
    expect(schema.safeParse({ src: '/placeholder.jpg', alt: '' }).success).toBe(true)
  })

  it("rifiuta un'immagine senza alt, così la scelta non si salta", () => {
    expect(schema.safeParse({ src: '/placeholder.jpg' }).success).toBe(false)
  })

  it('rifiuta una chiave sconosciuta invece di scartarla', () => {
    expect(schema.safeParse({ src: '/placeholder.jpg', alt: '', title: 'typo' }).success).toBe(false)
  })
})

describe('backgroundSchema', () => {
  it('accetta la sola immagine', () => {
    expect(backgroundSchema(image).safeParse({ src: '/placeholder.jpg' }).success).toBe(true)
  })

  it('rifiuta un alt, perché uno sfondo si rende con alt vuoto', () => {
    expect(backgroundSchema(image).safeParse({ src: '/placeholder.jpg', alt: 'A landscape' }).success).toBe(false)
  })
})
