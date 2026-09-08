// @ts-check

import sitemap from '@astrojs/sitemap'
import vercel from '@astrojs/vercel'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, envField } from 'astro/config'

import { cspIntegration } from './src/lib/csp/integration'
import { isExcludedFromSitemap } from './src/lib/seo/crawl-policy'
import { SITE } from './src/lib/site'

export default defineConfig({
  site: SITE.url,
  output: 'static',
  // Il default 'ignore' di Astro risolve sia /pagina sia /pagina/, dando alle due forme
  // canonical concorrenti. head.astro normalizza su quello che si imposta qui.
  trailingSlash: 'never',
  // Il default `hover` documentato non fa niente su touch. Astro limita il costo di
  // `viewport` saltando i link scorsi in fretta e rispettando Save-Data.
  prefetch: { prefetchAll: true, defaultStrategy: 'viewport' },

  // Sopra gli 8s che il client Brevo si concede, molto sotto il default di piattaforma
  // che è di minuti. Vale per l'unica funzione `_render`, che serve anche /_image.
  adapter: vercel({ maxDuration: 20 }),
  i18n: {
    defaultLocale: 'it',
    locales: ['it'],
    routing: {
      prefixDefaultLocale: false,
    },
  },
  integrations: [
    // Prima dell'adapter: riscrive l'HTML sotto dist/client, che l'adapter poi copia
    // in .vercel/output/static.
    cspIntegration(),
    // Emette sitemap-index.xml, a cui src/pages/robots.txt.ts indirizza i crawler.
    // Le esclusioni stanno in src/lib/seo/crawl-policy.ts, mai qui.
    sitemap({
      filter: (page) => !isExcludedFromSitemap(page),
      i18n: {
        defaultLocale: 'it',
        locales: { ...SITE.localeTags },
      },
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
  env: {
    schema: {
      // Facoltativa di proposito: senza la chiave src/lib/vendor/brevo.ts non fa niente
      // in sviluppo e rifiuta in produzione. Vedi docs/guides/forms-email.md.
      BREVO_API_KEY: envField.string({
        context: 'server',
        access: 'secret',
        optional: true,
      }),
      CONTACT_FROM_EMAIL: envField.string({
        context: 'server',
        access: 'public',
        default: 'no-reply@example.com',
      }),
      CONTACT_FROM_NAME: envField.string({
        context: 'server',
        access: 'public',
        default: '<PROJECT_NAME>',
      }),
      CONTACT_TO_EMAIL: envField.string({
        context: 'server',
        access: 'public',
        default: 'info@example.com',
      }),
      // Non è un interruttore: BotID classifica comunque, questo sceglie solo cosa
      // succede a una richiesta che chiama bot — false osserva e registra, true rifiuta.
      BOTID_ENFORCE: envField.boolean({
        context: 'server',
        access: 'public',
        default: false,
      }),
      // Su Vercel si creano Plain, mai Sensitive: una variabile Sensitive arriva a un
      // pull prebuilt come la stringa letterale "[SENSITIVE]".
      PUBLIC_GTM_ID: envField.string({
        context: 'client',
        access: 'public',
        optional: true,
      }),
      PUBLIC_IUBENDA_SITE_ID: envField.string({
        context: 'client',
        access: 'public',
        optional: true,
      }),
      PUBLIC_IUBENDA_COOKIE_POLICY_ID: envField.string({
        context: 'client',
        access: 'public',
        optional: true,
      }),
    },
  },
})
