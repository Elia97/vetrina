import { type CollectionEntry, type CollectionKey, getCollection } from 'astro:content'

import { assertDefaultLocaleFlat, contentFolder, resolveLocale } from '@/lib/content/locale-layout'

type Sectioned = {
  [C in CollectionKey]: CollectionEntry<C>['data'] extends { section: string } ? C : never
}[CollectionKey]

type SectionId<C extends Sectioned> = CollectionEntry<C>['data']['section']

type SectionData<C extends Sectioned, S extends SectionId<C>> = Extract<CollectionEntry<C>['data'], { section: S }>

export type SectionedPage<C extends Sectioned> = { [S in SectionId<C>]: SectionData<C, S> }

export async function loadLocalizedSections<C extends Sectioned>(
  collection: C,
  locale?: string,
): Promise<{ pick: <S extends SectionId<C>>(section: S) => SectionData<C, S> }> {
  const layout = resolveLocale(locale)
  const entries = await getCollection(collection)
  assertDefaultLocaleFlat(
    collection,
    entries.map((entry) => entry.id),
  )

  const bySection = new Map<SectionId<C>, CollectionEntry<C>['data']>()
  const sourceIds = new Map<SectionId<C>, string>()
  for (const entry of entries) {
    const inLocale = layout.isDefault ? !entry.id.includes('/') : entry.id.startsWith(`${layout.resolved}/`)
    if (!inLocale) continue
    const existing = sourceIds.get(entry.data.section)
    if (existing) {
      throw new Error(
        `Duplicate ${collection} section "${entry.data.section}" for locale "${layout.resolved}": ` +
          `"${existing}" and "${entry.id}"`,
      )
    }
    sourceIds.set(entry.data.section, entry.id)
    bySection.set(entry.data.section, entry.data)
  }

  const pick = <S extends SectionId<C>>(section: S): SectionData<C, S> => {
    const data = bySection.get(section)
    if (!data) {
      throw new Error(`${collection} section "${section}" not found in ${contentFolder(collection, layout)}`)
    }
    return data as SectionData<C, S>
  }

  return { pick }
}
