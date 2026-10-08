import { renderToFragment } from '@test/container'
import { describe, expect, it } from 'vitest'

import Select from './select.astro'

const options = [
  { value: 'call', label: 'Call' },
  { value: 'quote', label: 'Quote' },
]

async function render(value?: string) {
  const document = await renderToFragment(Select, { props: { options, placeholder: 'Choose', value } })
  const label = document.querySelector('[data-select-value]')
  return {
    native: document.querySelector('[data-select-native]'),
    selected: Array.from(document.querySelectorAll('[data-select-native] option[selected]'), (option) =>
      option.getAttribute('value'),
    ),
    label: label?.textContent?.trim(),
    muted: label?.classList.contains('text-muted-foreground'),
  }
}

describe('select.astro', () => {
  it("segna il valore iniziale nel select nativo e nell'etichetta del trigger", async () => {
    const select = await render('quote')

    expect(select.selected).toEqual(['quote'])
    expect(select.native?.hasAttribute('value')).toBe(false)
    expect(select.label).toBe('Quote')
    expect(select.muted).toBe(false)
  })

  it('senza valore resta sul placeholder, attenuato', async () => {
    const select = await render()

    expect(select.selected).toEqual([''])
    expect(select.label).toBe('Choose')
    expect(select.muted).toBe(true)
  })

  it('con un valore che nessuna opzione porta resta sul placeholder', async () => {
    const select = await render('missing')

    expect(select.selected).toEqual([''])
    expect(select.label).toBe('Choose')
  })
})
