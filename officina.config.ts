import { defineConfig } from '@elia97/officina'

import { SITE } from './src/lib/site.ts'

export default defineConfig({
  siteUrl: SITE.url,
  icons: { background: SITE.themeColor.light },
})
