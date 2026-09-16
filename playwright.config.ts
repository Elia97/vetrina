import { defineConfig, devices } from '@playwright/test'

const PORT = Number(process.env.E2E_PORT ?? 4321)
const baseURL = `http://localhost:${PORT}`

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: { ...devices['Desktop Chrome'], baseURL, trace: 'on-first-retry' },
  // `astro preview` non funziona con l'adapter Vercel, e lo `staticDistDir` di LHCI serve
  // attraverso express.static, che fa un 301 sullo slash finale: entrambi falserebbero le prove.
  webServer: {
    command: `pnpm dlx serve@14 dist/client --listen ${PORT} --no-clipboard`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
