import { renderToFragment } from '@test/container'
import { stylesheet, utility } from '@test/helpers/css-tokens'
import { describe, expect, it } from 'vitest'

import Alert from './alert.astro'
import AlertDescription from './description.astro'

describe('alert.astro', () => {
  it('non porta nessun ruolo di suo, così un avviso statico non viene annunciato', async () => {
    const document = await renderToFragment(Alert, { slots: { default: 'Draft notice' } })

    expect(document.querySelector('div')?.hasAttribute('role')).toBe(false)
  })

  it('tiene il ruolo che chi lo usa gli passa', async () => {
    const document = await renderToFragment(Alert, { props: { role: 'status' }, slots: { default: 'Sent' } })

    expect(document.querySelector('div')?.getAttribute('role')).toBe('status')
  })
})

const VARIANTS = ['default', 'destructive', 'success', 'warning', 'muted'] as const
const STATES = ['destructive', 'success', 'warning'] as const
const SHAPE_CLASS = /^(?:border(?:-[xytbsel])?(?:-\d+)?|rounded(?:-(?:none|xs|sm|md|lg|xl|2xl|3xl|4xl|full))?)$/

async function classesOf(variant: (typeof VARIANTS)[number]) {
  const document = await renderToFragment(Alert, { props: { variant }, slots: { default: 'Saved' } })
  return (document.querySelector('div')?.getAttribute('class') ?? '').split(' ')
}

describe('la forma di alert.astro', () => {
  it.each(['alert-border-width', 'alert-border-start-width', 'alert-radius'])(
    'tokens.css porta --%s, e alert-shape lo legge',
    (token) => {
      expect(stylesheet('tokens.css')).toContain(`--${token}:`)
      expect(utility('alert-shape')).toContain(`var(--${token})`)
    },
  )

  it.each(VARIANTS)('la variante %s prende la forma da alert-shape, senza spessori o raggi suoi', async (variant) => {
    const classes = await classesOf(variant)

    expect(classes).toContain('alert-shape')
    expect(classes.filter((name) => SHAPE_CLASS.test(name))).toEqual([])
  })
})

describe('le varianti di stato di alert.astro', () => {
  it.each(STATES)('%s ha fondo muted, testo normale, bordo e icona nel colore dello stato', async (state) => {
    expect(await classesOf(state)).toEqual(
      expect.arrayContaining([
        'bg-muted',
        'text-foreground',
        `border-${state}`,
        `[&>svg]:text-${state}`,
        '*:data-[slot=alert-description]:text-foreground',
      ]),
    )
  })

  it('AlertDescription porta lo slot che le varianti di stato raggiungono', async () => {
    const document = await renderToFragment(AlertDescription, { slots: { default: 'Saved' } })

    expect(document.querySelector('div')?.getAttribute('data-slot')).toBe('alert-description')
  })
})
