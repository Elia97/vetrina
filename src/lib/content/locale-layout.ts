import { DEFAULT_LOCALE } from '@/lib/site'

export interface ResolvedLocale {
  resolved: string
  isDefault: boolean
}

export function resolveLocale(locale: string | undefined): ResolvedLocale {
  const resolved = locale ?? DEFAULT_LOCALE
  return { resolved, isDefault: resolved === DEFAULT_LOCALE }
}

export function assertDefaultLocaleFlat(collection: string, ids: readonly string[]): void {
  const misplaced = ids.find((id) => id.startsWith(`${DEFAULT_LOCALE}/`))
  if (misplaced) {
    throw new Error(
      `Default-locale ${collection} content must live flat in src/content/${collection}/ — ` +
        `move "${misplaced}" out of the "${DEFAULT_LOCALE}/" folder`,
    )
  }
}

export function contentFolder(collection: string, { resolved, isDefault }: ResolvedLocale): string {
  return isDefault ? `src/content/${collection}/` : `src/content/${collection}/${resolved}/`
}
