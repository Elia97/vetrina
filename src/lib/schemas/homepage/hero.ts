import type { SchemaContext } from 'astro:content'
import { z } from 'astro/zod'

import { backgroundSchema, ctaSchema } from '../common'

export function heroSectionSchema({ image }: SchemaContext) {
  return z.strictObject({
    section: z.literal('hero'),
    eyebrow: z.string().optional(),
    title: z.string().min(1),
    subtitle: z.string().optional(),
    image: backgroundSchema(image).optional(),
    buttons: z.array(ctaSchema).max(2).default([]),
  })
}

export type HeroSection = z.infer<ReturnType<typeof heroSectionSchema>>
