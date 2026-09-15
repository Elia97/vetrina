import { renderToFragment } from '@test/container'
import { describe, expect, it } from 'vitest'

import Alert from './alert.astro'

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
