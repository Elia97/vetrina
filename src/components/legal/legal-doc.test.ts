import { renderToFragment } from '@test/container'
import { describe, expect, it } from 'vitest'

import Heading from '@/components/ui/heading.astro'

import LegalDoc from './legal-doc.astro'

const SPACING = /^m[tb]-/

function typographyFor(element: string, classes: readonly string[]): string[] {
  const prefix = `[&_${element}]:`
  return classes
    .filter((name) => name.includes(prefix))
    .map((name) => name.replace(prefix, ''))
    .filter((name) => !SPACING.test(name))
    .sort()
}

describe('legal-doc.astro', () => {
  it.each([
    ['h1', 'h1'],
    ['h2', 'h3'],
  ])("dà all'%s dei documenti iubenda le classi di Heading con size %s", async (element, size) => {
    const [legalDoc, heading] = await Promise.all([
      renderToFragment(LegalDoc, { props: { kind: 'privacy', html: `<${element}>Privacy Policy</${element}>` } }),
      renderToFragment(Heading, { props: { as: element, size } }),
    ])

    const prose = legalDoc.querySelector(element)?.parentElement?.getAttribute('class')?.split(' ') ?? []
    const primitive = heading.querySelector(element)?.getAttribute('class')?.split(' ') ?? []
    expect(primitive).not.toHaveLength(0)
    expect(typographyFor(element, prose)).toEqual([...primitive].sort())
  })
})
