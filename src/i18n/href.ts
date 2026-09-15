import { getRelativeLocaleUrl } from 'astro:i18n'

import { DEFAULT_LOCALE } from '@/lib/site'

import { translatePath } from '@/i18n/route-segments'

export function localizedHref(locale: string | undefined, path: string): string {
  const target = locale ?? DEFAULT_LOCALE
  return getRelativeLocaleUrl(target, translatePath(path, target))
}
