import { existsSync } from 'node:fs'
import { join } from 'node:path'
import process from 'node:process'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { COMPANY } from '@/lib/company'
import {
  buildArticle,
  buildBreadcrumbList,
  buildFaqPage,
  buildItemList,
  buildLocalBusiness,
  buildOrganization,
  buildWebSite,
} from '@/lib/seo/json-ld'
import { SITE } from '@/lib/site'

const TRAIL = [
  { name: 'Home', url: '/' },
  { name: 'Privacy', url: '/privacy' },
]

async function importWith(social: readonly { label: string; href: string }[], logo: string | null) {
  vi.resetModules()
  vi.doMock('@/lib/site', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@/lib/site')>()
    return { ...actual, SITE: { ...actual.SITE, social } }
  })
  vi.doMock('@/lib/company', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@/lib/company')>()
    return { COMPANY: { ...actual.COMPANY, logo } }
  })
  return import('@/lib/seo/json-ld')
}

afterEach(() => {
  vi.doUnmock('@/lib/site')
  vi.doUnmock('@/lib/company')
  vi.resetModules()
})

describe('buildBreadcrumbList', () => {
  it('numbers positions from 1 and absolutizes URLs', () => {
    const schema = buildBreadcrumbList(TRAIL)
    expect(schema['@type']).toBe('BreadcrumbList')
    expect(schema.itemListElement).toEqual([
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://example.com/' },
      { '@type': 'ListItem', position: 2, name: 'Privacy', item: 'https://example.com/privacy' },
    ])
  })
})

describe('buildItemList', () => {
  it('uses the `url` key (ItemList) instead of `item` (BreadcrumbList)', () => {
    const schema = buildItemList([{ name: 'Voce', url: '/sezione/voce' }])
    expect(schema['@type']).toBe('ItemList')
    expect(schema.itemListElement).toEqual([
      { '@type': 'ListItem', position: 1, name: 'Voce', url: 'https://example.com/sezione/voce' },
    ])
  })
})

describe('buildOrganization', () => {
  it('carries the company identity and a PostalAddress', () => {
    const schema = buildOrganization()

    expect(schema).toMatchObject({
      '@type': 'Organization',
      name: COMPANY.legalName,
      url: SITE.url,
      address: { '@type': 'PostalAddress' },
    })
  })
})

describe('i campi aziendali di Organization e LocalBusiness', () => {
  const profile = { label: 'LinkedIn', href: 'https://www.linkedin.com/company/acme' }

  it('portano la partita IVA come vatID, i profili come sameAs e il logo come URL assoluto', async () => {
    const jsonLd = await importWith([profile], '/logo.png')
    const expected = { vatID: COMPANY.vatNumber, sameAs: [profile.href], logo: new URL('/logo.png', SITE.url).href }

    expect(jsonLd.buildOrganization()).toMatchObject(expected)
    expect(jsonLd.buildLocalBusiness()).toMatchObject(expected)
  })

  it('omettono sameAs e logo quando il progetto non li configura', async () => {
    const organization = (await importWith([], null)).buildOrganization()

    expect(organization).not.toHaveProperty('sameAs')
    expect(organization).not.toHaveProperty('logo')
  })

  it('un logo dichiarato in COMPANY esiste in public/', () => {
    const missing = COMPANY.logo !== null && !existsSync(join(process.cwd(), 'public', COMPANY.logo))

    expect(missing, `COMPANY.logo punta a public${COMPANY.logo}, che non esiste`).toBe(false)
  })
})

describe('buildLocalBusiness', () => {
  it('porta orari e coordinate quando il progetto li fornisce', () => {
    const schema = buildLocalBusiness({
      openingHours: ['Mo-Fr 09:00-18:00'],
      geo: { latitude: 45.4642, longitude: 9.19 },
    })

    expect(schema).toMatchObject({
      '@type': 'LocalBusiness',
      name: COMPANY.legalName,
      openingHours: ['Mo-Fr 09:00-18:00'],
      geo: { '@type': 'GeoCoordinates', latitude: 45.4642, longitude: 9.19 },
    })
  })

  it('omette orari e coordinate che il progetto non fornisce', () => {
    const schema = buildLocalBusiness()

    expect(schema).not.toHaveProperty('openingHours')
    expect(schema).not.toHaveProperty('geo')
  })
})

describe('buildWebSite', () => {
  it('names the site, not the company', () => {
    expect(buildWebSite()).toMatchObject({ '@type': 'WebSite', name: SITE.name, url: SITE.url })
  })
})

describe('buildArticle', () => {
  const entry = {
    headline: 'Titolo',
    description: 'Sommario',
    url: '/news/titolo',
    datePublished: '2026-09-02',
  }

  it('absolutizes mainEntityOfPage and credits the organization', () => {
    const schema = buildArticle(entry)

    expect(schema).toMatchObject({
      '@type': 'Article',
      mainEntityOfPage: new URL('/news/titolo', SITE.url).href,
      author: { '@type': 'Organization', name: SITE.name },
      publisher: { legalName: COMPANY.legalName },
    })
  })

  it('omits image entirely when there is none, rather than emitting undefined', () => {
    expect(buildArticle(entry)).not.toHaveProperty('image')
    expect(buildArticle({ ...entry, image: '/og/x.jpg' })).toHaveProperty('image', new URL('/og/x.jpg', SITE.url).href)
  })
})

describe('buildFaqPage', () => {
  it('wraps every entry as a Question with its accepted Answer', () => {
    const schema = buildFaqPage([{ question: 'Quanto costa?', answer: 'Dipende.' }])

    expect(schema.mainEntity).toEqual([
      { '@type': 'Question', name: 'Quanto costa?', acceptedAnswer: { '@type': 'Answer', text: 'Dipende.' } },
    ])
  })

  it('emits an empty mainEntity rather than failing on no entries', () => {
    expect(buildFaqPage([]).mainEntity).toEqual([])
  })
})
