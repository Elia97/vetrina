/// <reference types="vitest/config" />
import { fileURLToPath } from 'node:url'
import { getViteConfig } from 'astro/config'

const astroEnvServerStub = fileURLToPath(new URL('./test/stubs/astro-env-server.ts', import.meta.url))
const astroEnvClientStub = fileURLToPath(new URL('./test/stubs/astro-env-client.ts', import.meta.url))
const astroConfigClientStub = fileURLToPath(new URL('./test/stubs/astro-config-client.ts', import.meta.url))
const astroI18nStub = fileURLToPath(new URL('./test/stubs/astro-i18n.ts', import.meta.url))
const astroContentStub = fileURLToPath(new URL('./test/stubs/astro-content.ts', import.meta.url))
const astroActionsStub = fileURLToPath(new URL('./test/stubs/astro-actions.ts', import.meta.url))
const srcDir = fileURLToPath(new URL('./src', import.meta.url))
const testDir = fileURLToPath(new URL('./test', import.meta.url))

export default getViteConfig({
  resolve: {
    alias: {
      'astro:env/server': astroEnvServerStub,
      'astro:env/client': astroEnvClientStub,
      'astro:config/client': astroConfigClientStub,
      'astro:i18n': astroI18nStub,
      'astro:content': astroContentStub,
      'astro:actions': astroActionsStub,
      '@': srcDir,
      '@test': testDir,
    },
  },
  test: {
    // I render della Container API vogliono questo default: la nota sta in test/container.ts.
    environment: 'node',
    // [HARD] Astro instrada ogni file in `src/pages/**`, quindi un test lì si costruisce come
    // pagina e fa esplodere il prerender su `vi.mock`: quelli stanno in `test/pages/`.
    include: ['src/**/*.test.ts', 'test/**/*.test.ts'],
    exclude: ['src/pages/**/*.test.ts', 'node_modules/**'],
    // Il gate CRAP di fallow legge coverage/coverage-final.json, che scrive il reporter `json`;
    // senza, stima la copertura dal grafo dei moduli invece di leggerla.
    coverage: {
      provider: 'v8',
      reporter: ['text-summary', 'json'],
      include: ['src/**/*.ts', 'src/components/layout/footer.astro', 'src/components/homepage/hero.astro'],
      exclude: ['**/*.test.ts', 'src/types/**', 'src/content.config.ts', 'src/lib/company.ts', 'src/i18n/strings/**'],
      thresholds: { 'src/**': { 100: true } },
    },
  },
})
