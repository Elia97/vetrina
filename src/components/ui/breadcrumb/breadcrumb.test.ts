import { renderToFragment } from '@test/container'
import { describe, expect, it } from 'vitest'

import { buildBreadcrumbList } from '@/lib/seo/json-ld'

import { useTranslations } from '@/i18n/translate'

import Breadcrumb from './breadcrumb.astro'

const items = [
  { name: 'Home', url: '/' },
  { name: 'Services', url: '/services' },
  { name: 'Consulting', url: '/services/consulting' },
]

const render = () => renderToFragment(Breadcrumb, { props: { items } })

describe('breadcrumb.astro', () => {
  it("è una navigazione con l'etichetta del dizionario e un link per ogni voce del percorso", async () => {
    const document = await render()

    expect(document.querySelector('nav')?.getAttribute('aria-label')).toBe(useTranslations()('a11y.breadcrumb'))
    expect([...document.querySelectorAll('ol > li > a')].map((link) => link.getAttribute('href'))).toEqual([
      '/',
      '/services',
      '/services/consulting',
    ])
  })

  it("segna come pagina corrente solo l'ultima voce", async () => {
    const document = await render()

    expect([...document.querySelectorAll('a')].map((link) => link.getAttribute('aria-current'))).toEqual([
      null,
      null,
      'page',
    ])
  })

  it('mette fra una voce e la successiva un separatore nascosto alle tecnologie assistive', async () => {
    const document = await render()

    const separators = [...document.querySelectorAll('svg')]
    expect(separators).toHaveLength(items.length - 1)
    expect(separators.map((separator) => separator.getAttribute('aria-hidden'))).toEqual(['true', 'true'])
  })

  it('rende gli stessi nomi del BreadcrumbList costruito dallo stesso elenco', async () => {
    const document = await render()

    const rendered = [...document.querySelectorAll('a')].map((link) => link.textContent?.trim())
    expect(rendered).toEqual(buildBreadcrumbList(items).itemListElement.map(({ name }) => name))
  })
})
