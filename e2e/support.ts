import type { Page } from '@playwright/test'

/** Il `source` del rewrite in vercel.json, che un server statico non ha. */
const BOTID_PREFIX = '**/149e9513-01fa-4fb0-aad4-566afd725d1b/**'

export const ACTION_PATH = '**/_actions/contact'

export type PageProblem = { kind: 'console' | 'pageerror' | 'csp'; text: string }

// Il `window.fetch` di botid/client/core attende `getChallenge()`, che rigetta se lo script non
// arriva: su dist/client servito piatto quel percorso è un 404 e il POST all'Action non parte.
export async function stubBotIdChallenge(page: Page): Promise<void> {
  await page.route(BOTID_PREFIX, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/javascript',
      // `b` diverso da 0 fa inoltrare la richiesta senza caricare anche il KPSDK.
      body: 'window.V_C.push({ b: 1 })',
    }),
  )
}

/** Raccoglie tutto ciò che un browser segnala e nessun test unitario può vedere. */
export function collectProblems(page: Page): PageProblem[] {
  const problems: PageProblem[] = []

  page.on('console', (message) => {
    if (message.type() === 'error') problems.push({ kind: 'console', text: message.text() })
  })
  page.on('pageerror', (error) => problems.push({ kind: 'pageerror', text: error.message }))

  return problems
}

export async function watchCspViolations(page: Page, problems: PageProblem[]): Promise<void> {
  await page.exposeFunction('reportCspViolation', (text: string) => {
    problems.push({ kind: 'csp', text })
  })
  await page.addInitScript(() => {
    document.addEventListener('securitypolicyviolation', (event) => {
      const violation = event as SecurityPolicyViolationEvent
      const report = `${violation.violatedDirective} blocked ${violation.blockedURI}`
      ;(window as unknown as { reportCspViolation: (text: string) => void }).reportCspViolation(report)
    })
  })
}
