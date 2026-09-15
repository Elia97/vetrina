import { type CollectionKey, getCollection } from 'astro:content'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { loadLocalizedEntry } from '@/lib/content/localized-entry'

vi.mock('astro:content')

const SERVICES = 'services' as CollectionKey

function mockEntries(ids: string[]) {
  const entries = ids.map((id) => ({ id, data: { title: id }, body: `Body of ${id}` }))
  vi.mocked(getCollection).mockResolvedValue(entries as never)
  return entries
}

afterEach(() => {
  vi.clearAllMocks()
})

describe('loadLocalizedEntry', () => {
  it('nella lingua di default legge la voce piatta', async () => {
    mockEntries(['consulting', 'en/consulting'])

    const entry = await loadLocalizedEntry(SERVICES, 'consulting')

    expect(entry.id).toBe('consulting')
  })

  it("in un'altra lingua legge la voce dalla sottocartella della lingua", async () => {
    mockEntries(['consulting', 'en/consulting'])

    const entry = await loadLocalizedEntry(SERVICES, 'consulting', 'en')

    expect(entry.id).toBe('en/consulting')
  })

  it('trova una voce annidata in una cartella, in ogni lingua', async () => {
    mockEntries(['web/design', 'en/web/design'])

    expect((await loadLocalizedEntry(SERVICES, 'web/design')).id).toBe('web/design')
    expect((await loadLocalizedEntry(SERVICES, 'web/design', 'en')).id).toBe('en/web/design')
  })

  it('restituisce la voce intera, che una collection documento passa a render()', async () => {
    const [consulting] = mockEntries(['consulting'])

    expect(await loadLocalizedEntry(SERVICES, 'consulting')).toBe(consulting)
  })
})

describe('loadLocalizedEntry — il contratto del fallire rumorosamente', () => {
  it('ferma il build su una voce che manca, nominando la cartella della lingua', async () => {
    mockEntries(['consulting'])

    await expect(loadLocalizedEntry(SERVICES, 'hosting')).rejects.toThrow('src/content/services/')
    await expect(loadLocalizedEntry(SERVICES, 'consulting', 'en')).rejects.toThrow('src/content/services/en/')
  })

  it('rifiuta una voce della lingua di default finita nella sua sottocartella', async () => {
    mockEntries(['it/consulting'])

    await expect(loadLocalizedEntry(SERVICES, 'consulting')).rejects.toThrow(/must live flat/)
  })
})
