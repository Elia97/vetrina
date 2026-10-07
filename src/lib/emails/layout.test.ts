import { describe, expect, it } from 'vitest'

import { detailRow, escapeHtml, layout } from '@/lib/emails/layout'

import { it as dictionary } from '@/i18n/strings/it'

describe('escapeHtml', () => {
  it("sostituisce i cinque caratteri speciali dell'HTML", () => {
    expect(escapeHtml(`<a href="x">Tom & Jerry's</a>`)).toBe(
      '&lt;a href=&quot;x&quot;&gt;Tom &amp; Jerry&#39;s&lt;/a&gt;',
    )
  })

  it('lascia intatto il testo senza caratteri speciali', () => {
    expect(escapeHtml('Plain text, 42.')).toBe('Plain text, 42.')
  })
})

describe('layout', () => {
  it('prende la lingua del documento da email.lang', () => {
    expect(layout('Heading', '')).toContain(`<html lang="${dictionary['email.lang']}">`)
  })

  it('passa il titolo da escapeHtml', () => {
    const html = layout('<b>Hello</b>', '')
    expect(html).toContain('&lt;b&gt;Hello&lt;/b&gt;')
    expect(html).not.toContain('<b>Hello</b>')
  })

  it("inserisce il corpo così com'è", () => {
    const body = '<p>Already <em>escaped</em></p>'
    expect(layout('Heading', body)).toContain(body)
  })
})

describe('detailRow', () => {
  it('non rende niente senza un valore', () => {
    expect(detailRow('Label')).toBe('')
    expect(detailRow('Label', '')).toBe('')
  })

  it('passa etichetta e valore da escapeHtml', () => {
    const row = detailRow('<Name>', 'Tom & Jerry')
    expect(row).toContain('&lt;Name&gt;')
    expect(row).toContain('Tom &amp; Jerry')
  })
})
