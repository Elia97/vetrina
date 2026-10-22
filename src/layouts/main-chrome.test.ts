import { renderToFragment } from '@test/container'
import { describe, expect, it, vi } from 'vitest'

import { DEFAULT_LOCALE } from '@/lib/site'

import MainLayout from './main.astro'

vi.mock('@/components/layout/chrome', async () => ({
  Footer: (await import('@test/fixtures/derived-footer.astro')).default,
  Header: (await import('@test/fixtures/derived-header.astro')).default,
}))

async function renderMain(props: Record<string, unknown> = {}) {
  return renderToFragment(MainLayout, {
    request: new Request('https://example.com/'),
    props: { title: 'Home', ...props },
  })
}

describe('main.astro con la chrome di un template derivato', () => {
  it('rende header e footer che esporta chrome.ts, non quelli della base', async () => {
    const document = await renderMain()

    const chrome = [...document.querySelectorAll('header, footer')].map((element) =>
      element.getAttribute('data-chrome'),
    )
    expect(chrome).toEqual(['header', 'footer'])
  })

  it("passa all'header solo heroOverlay, overlayChrome, locales e languagePrefetch", async () => {
    const headerProps = {
      heroOverlay: true,
      overlayChrome: 'light',
      locales: [DEFAULT_LOCALE],
      languagePrefetch: false,
    }
    const document = await renderMain(headerProps)

    expect(JSON.parse(document.querySelector('header')?.getAttribute('data-props') ?? '{}')).toEqual(headerProps)
  })
})
