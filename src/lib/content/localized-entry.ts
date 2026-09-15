import { type CollectionEntry, type CollectionKey, getCollection } from 'astro:content'

import { assertDefaultLocaleFlat, contentFolder, resolveLocale } from '@/lib/content/locale-layout'

/** @public */
export async function loadLocalizedEntry<C extends CollectionKey>(
  collection: C,
  id: string,
  locale?: string,
): Promise<CollectionEntry<C>> {
  const layout = resolveLocale(locale)
  const entries = await getCollection(collection)
  assertDefaultLocaleFlat(
    collection,
    entries.map((entry) => entry.id),
  )

  const wanted = layout.isDefault ? id : `${layout.resolved}/${id}`
  const entry = entries.find((candidate) => candidate.id === wanted)
  if (!entry) {
    throw new Error(`${collection} entry "${id}" not found in ${contentFolder(collection, layout)}`)
  }
  return entry
}
