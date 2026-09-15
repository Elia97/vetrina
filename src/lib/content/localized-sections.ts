import { type CollectionEntry, type CollectionKey, getCollection } from 'astro:content'

import { DEFAULT_LOCALE } from '@/lib/site'

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
  const resolved = locale ?? DEFAULT_LOCALE
  const isDefault = resolved === DEFAULT_LOCALE
  const entries = await getCollection(collection)

  const misplaced = entries.find((entry) => entry.id.startsWith(`${DEFAULT_LOCALE}/`))
  if (misplaced) {
    throw new Error(
      `Default-locale ${collection} content must live flat in src/content/${collection}/ — ` +
        `move "${misplaced.id}" out of the "${DEFAULT_LOCALE}/" folder`,
    )
  }

  const bySection = new Map<SectionId<C>, CollectionEntry<C>['data']>()
  const sourceIds = new Map<SectionId<C>, string>()
  for (const entry of entries) {
    const inLocale = isDefault ? !entry.id.includes('/') : entry.id.startsWith(`${resolved}/`)
    if (!inLocale) continue
    const existing = sourceIds.get(entry.data.section)
    if (existing) {
      throw new Error(
        `Duplicate ${collection} section "${entry.data.section}" for locale "${resolved}": ` +
          `"${existing}" and "${entry.id}"`,
      )
    }
    sourceIds.set(entry.data.section, entry.id)
    bySection.set(entry.data.section, entry.data)
  }

  const pick = <S extends SectionId<C>>(section: S): SectionData<C, S> => {
    const data = bySection.get(section)
    if (!data) {
      const where = isDefault ? `src/content/${collection}/` : `src/content/${collection}/${resolved}/`
      throw new Error(`${collection} section "${section}" not found in ${where}`)
    }
    return data as SectionData<C, S>
  }

  return { pick }
}
