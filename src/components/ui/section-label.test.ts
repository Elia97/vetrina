import { renderToFragment } from '@test/container'
import { stylesheet } from '@test/helpers/css-tokens'
import { describe, expect, it } from 'vitest'

import SectionLabel from './section-label.astro'

const props = { label: 'Novità' }

describe('section-label.astro', () => {
  it('senza label non rende niente', async () => {
    const fragment = await renderToFragment(SectionLabel)

    expect(fragment.body.children).toHaveLength(0)
  })

  it('di default mette davanti il punto, nascosto alle tecnologie assistive', async () => {
    const fragment = await renderToFragment(SectionLabel, { props })

    expect(fragment.querySelector('[aria-hidden="true"]')?.querySelectorAll('.rounded-full')).toHaveLength(2)
  })

  it('uno slot marker prende il posto del punto', async () => {
    const fragment = await renderToFragment(SectionLabel, {
      props,
      slots: { marker: '<span data-marker aria-hidden="true"></span>' },
    })

    expect(fragment.querySelector('[data-marker]')).not.toBeNull()
    expect(fragment.querySelector('.rounded-full')).toBeNull()
  })

  it('prende colore, fondo, spaziatura interna e raggio dai token', async () => {
    const fragment = await renderToFragment(SectionLabel, { props })
    const classes = ['p', 'p > span'].flatMap((selector) =>
      (fragment.querySelector(selector)?.getAttribute('class') ?? '').split(' '),
    )

    expect(classes).toEqual(
      expect.arrayContaining([
        'text-(color:--eyebrow-color)',
        'bg-(--eyebrow-background)',
        'p-(--eyebrow-padding)',
        'rounded-(--eyebrow-radius)',
      ]),
    )
  })

  it.each(['light.css', 'dark.css'])("%s porta --eyebrow-color, così un'isola .dark lo ricalcola", (file) => {
    expect(stylesheet(file)).toContain('--eyebrow-color:')
  })

  it.each(['eyebrow-background', 'eyebrow-padding', 'eyebrow-radius'])('tokens.css porta --%s', (token) => {
    expect(stylesheet('tokens.css')).toContain(`--${token}:`)
  })
})
