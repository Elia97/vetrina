import { renderToFragment } from '@test/container'
import { describe, expect, it } from 'vitest'

import { useTranslations } from '@/i18n/translate'

import Header from './header.astro'

describe('header.astro', () => {
  it.each([
    { nav: 'header', selector: 'header nav' },
    { nav: 'mobile', selector: '#mobile-nav nav' },
  ])('marca come pagina corrente solo la voce della pagina aperta, nella nav $nav', async ({ selector }) => {
    const document = await renderToFragment(Header, { request: new Request('https://example.com/contatti') })

    const marked = [...document.querySelectorAll(`${selector} a[aria-current]`)].map((link) => [
      link.getAttribute('href'),
      link.getAttribute('aria-current'),
    ])
    expect(marked).toEqual([['/contatti', 'page']])
  })

  it("con una lingua sola non rende il selettore, né nell'header né nella nav mobile", async () => {
    const document = await renderToFragment(Header, { request: new Request('https://example.com/contatti') })

    expect(document.querySelector(`nav[aria-label="${useTranslations()('a11y.languageNav')}"]`)).toBeNull()
  })
})
