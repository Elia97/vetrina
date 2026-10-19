import { renderToFragment } from '@test/container'
import { describe, expect, it } from 'vitest'

import Badge from '@/components/ui/badge.astro'
import Button from '@/components/ui/button.astro'
import Label from '@/components/ui/field/label.astro'
import Heading from '@/components/ui/heading.astro'
import SectionLabel from '@/components/ui/section-label.astro'

import { stylesheet, utility } from '../../test/helpers/css-tokens.ts'

const ROLES = ['control', 'label', 'heading', 'eyebrow'] as const
const PROPERTIES = ['font-family', 'font-weight', 'text-transform', 'letter-spacing'] as const
const PRIMITIVES = [
  ['Button', Button, 'control', {}],
  ['Label', Label, 'label', {}],
  ['Badge', Badge, 'label', {}],
  ['SectionLabel', SectionLabel, 'eyebrow', { label: 'Save' }],
  ['Heading display', Heading, 'heading-display', { size: 'display' }],
  ['Heading h1', Heading, 'heading', { size: 'h1' }],
  ['Heading h2', Heading, 'heading', { size: 'h2' }],
  ['Heading h3', Heading, 'heading-minor', { size: 'h3' }],
  ['Heading h4', Heading, 'heading-minor', { size: 'h4' }],
] as const
const TYPOGRAPHY_CLASS = /^(?:font-|tracking-|uppercase$|lowercase$|capitalize$|normal-case$)/

describe.each(ROLES)('ruolo %s', (role) => {
  it.each(PROPERTIES)('tokens.css porta il token di %s', (property) => {
    expect(stylesheet('tokens.css')).toContain(`--${role}-${property}:`)
  })

  it.each(PROPERTIES)(`type-${role} prende %s dal token del ruolo`, (property) => {
    expect(utility(`type-${role}`)).toContain(`${property}: var(--${role}-${property});`)
  })
})

describe('le fasce dei titoli', () => {
  it.each([
    ['type-heading-minor', 'font-weight', 'heading-minor-font-weight'],
    ['type-heading-display', 'letter-spacing', 'heading-display-letter-spacing'],
  ])('%s prende %s da --%s, che tokens.css porta', (name, property, token) => {
    expect(utility(name)).toContain(`${property}: var(--${token});`)
    expect(stylesheet('tokens.css')).toContain(`--${token}:`)
  })
})

describe.each(PRIMITIVES)('%s', (_name, primitive, role, props) => {
  it(`porta type-${role} e nessuna classe tipografica sua`, async () => {
    const fragment = await renderToFragment(primitive, { props, slots: { default: 'Save' } })
    const classes = (fragment.body.firstElementChild?.getAttribute('class') ?? '').split(' ')

    expect(classes).toContain(`type-${role}`)
    expect(classes.filter((name) => TYPOGRAPHY_CLASS.test(name.split(':').pop() ?? ''))).toEqual([])
  })
})
