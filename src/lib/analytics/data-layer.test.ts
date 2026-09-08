// @vitest-environment happy-dom
import { beforeEach, describe, expect, it } from 'vitest'

import { pushToDataLayer } from '@/lib/analytics/data-layer'

beforeEach(() => {
  // `delete`, non `= undefined`: exactOptionalPropertyTypes rifiuta undefined come valore,
  // e lo stato in prova è proprio "assente".
  delete window.dataLayer
})

describe('pushToDataLayer', () => {
  it('creates the queue on the first push', () => {
    pushToDataLayer({ event: 'test' })

    expect(window.dataLayer).toEqual([{ event: 'test' }])
  })

  it('appends to an existing queue, preserving order', () => {
    pushToDataLayer({ event: 'first' })
    pushToDataLayer({ event: 'second' })

    expect(window.dataLayer).toEqual([{ event: 'first' }, { event: 'second' }])
  })

  // Lo snippet di GTM può aver creato l'array prima che questo modulo giri.
  it('adopts a queue it did not create', () => {
    window.dataLayer = [{ event: 'from-gtm' }]

    pushToDataLayer({ event: 'ours' })

    expect(window.dataLayer).toHaveLength(2)
  })
})
