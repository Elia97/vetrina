/// <reference types="vitest/config" />
import { fileURLToPath } from 'node:url'
import { getViteConfig } from 'astro/config'
import { defineConfig } from 'vitest/config'

const astroEnvServerStub = fileURLToPath(new URL('./test/stubs/astro-env-server.ts', import.meta.url))
const astroEnvClientStub = fileURLToPath(new URL('./test/stubs/astro-env-client.ts', import.meta.url))
const astroConfigClientStub = fileURLToPath(new URL('./test/stubs/astro-config-client.ts', import.meta.url))
const astroI18nStub = fileURLToPath(new URL('./test/stubs/astro-i18n.ts', import.meta.url))
const astroContentStub = fileURLToPath(new URL('./test/stubs/astro-content.ts', import.meta.url))
const astroActionsStub = fileURLToPath(new URL('./test/stubs/astro-actions.ts', import.meta.url))
const srcDir = fileURLToPath(new URL('./src', import.meta.url))
const testDir = fileURLToPath(new URL('./test', import.meta.url))

const alias = {
  'astro:env/server': astroEnvServerStub,
  'astro:env/client': astroEnvClientStub,
  'astro:config/client': astroConfigClientStub,
  'astro:i18n': astroI18nStub,
  'astro:content': astroContentStub,
  'astro:actions': astroActionsStub,
  '@': srcDir,
  '@test': testDir,
}

// Un test fuori da queste cartelle che importa un `.astro` cade su «Failed to parse source for import
// analysis» di Vite, un errore che parla di JSX e non di cartelle.
const astroTests = [
  'src/components/**/*.test.ts',
  'src/layouts/**/*.test.ts',
  'src/styles/**/*.test.ts',
  'test/pages/**/*.test.ts',
  'src/middleware.test.ts',
]

export default defineConfig({
  test: {
    // Il gate CRAP di fallow legge coverage/coverage-final.json, che scrive il reporter `json`;
    // senza, stima la copertura dal grafo dei moduli invece di leggerla.
    coverage: {
      provider: 'v8',
      reporter: ['text-summary', 'json'],
      // biome-ignore format: una voce per riga, così i cherry-pick da vetrina non confliggono
      include: [
        'src/**/*.ts',
        'src/components/layout/footer.astro',
        'src/components/homepage/hero.astro',
      ],
      exclude: ['**/*.test.ts', 'src/types/**', 'src/content.config.ts', 'src/lib/company.ts', 'src/i18n/*/**'],
      thresholds: { 'src/**': { 100: true } },
    },
    projects: [
      {
        resolve: { alias },
        test: {
          name: 'unit',
          pool: 'threads',
          // [HARD] Astro instrada ogni file in `src/pages/**`, quindi un test lì si costruisce come
          // pagina e fa esplodere il prerender su `vi.mock`: quelli stanno in `test/pages/`.
          include: ['src/**/*.test.ts', 'test/**/*.test.ts'],
          exclude: ['src/pages/**/*.test.ts', 'node_modules/**', ...astroTests],
        },
      },
      getViteConfig({
        resolve: { alias },
        test: {
          name: 'astro',
          pool: 'threads',
          // I render della Container API vogliono questo default: la nota sta in test/container.ts.
          environment: 'node',
          include: astroTests,
        },
      }),
    ],
  },
})
