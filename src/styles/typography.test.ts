import { readFileSync } from 'node:fs'
import { renderToFragment } from '@test/container'
import { describe, expect, it } from 'vitest'

import Badge from '@/components/ui/badge.astro'
import Button from '@/components/ui/button.astro'
import Label from '@/components/ui/field/label.astro'

// Forma eseguibile di docs/guides/ui-components.md § Token di design: la tipografia di controlli ed etichette.

const ROLES = ['control', 'label'] as const
const PROPERTIES = ['font-family', 'font-weight', 'text-transform', 'letter-spacing'] as const
const PRIMITIVES = [
  ['Button', Button, 'control'],
  ['Label', Label, 'label'],
  ['Badge', Badge, 'label'],
] as const
const TYPOGRAPHY_CLASS = /^(?:font-|tracking-|uppercase$|lowercase$|capitalize$|normal-case$)/

function read(file: string): string {
  return readFileSync(new URL(`./${file}`, import.meta.url), 'utf8')
}

function utility(name: string): string {
  const css = read('globals.css')
  const start = css.indexOf(`@utility ${name} {`)
  return start === -1 ? '' : css.slice(start, css.indexOf('}', start))
}

describe.each(ROLES)('ruolo %s', (role) => {
  it.each(PROPERTIES)('tokens.css porta il token di %s', (property) => {
    expect(read('tokens.css')).toContain(`--${role}-${property}:`)
  })

  it.each(PROPERTIES)(`type-${role} prende %s dal token del ruolo`, (property) => {
    expect(utility(`type-${role}`)).toContain(`${property}: var(--${role}-${property});`)
  })
})

describe.each(PRIMITIVES)('%s', (_name, primitive, role) => {
  it(`porta type-${role} e nessuna classe tipografica sua`, async () => {
    const fragment = await renderToFragment(primitive, { slots: { default: 'Save' } })
    const classes = (fragment.body.firstElementChild?.getAttribute('class') ?? '').split(' ')

    expect(classes).toContain(`type-${role}`)
    expect(classes.filter((name) => TYPOGRAPHY_CLASS.test(name.split(':').pop() ?? ''))).toEqual([])
  })
})
