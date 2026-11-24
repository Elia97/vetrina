import { defineConfig } from '@elia97/officina'

import { SITE } from './src/lib/site.ts'

export default defineConfig({
  siteUrl: SITE.url,
  icons: { background: SITE.themeColor.light },
  placeholders: { contactEnvKeys: ['CONTACT_FROM_EMAIL', 'CONTACT_FROM_NAME', 'CONTACT_TO_EMAIL', 'SITE_URL'] },
  features: {
    analytics: false,
    roadmap: 'required',
    generators: 'required',
    botId: 'required',
    links: 'required',
  },
})
