import { it } from './strings/it'

export type { UIKey } from './strings/it'

export const dictionaries = { it } satisfies Record<string, Record<keyof typeof it, string>>

export type UILocale = keyof typeof dictionaries
