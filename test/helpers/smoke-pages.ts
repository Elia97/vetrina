import { expectedRoutes, readPageFiles, smokeRoutes } from '../../scripts/lib/routes'

const PAGES_DIR = 'src/pages'

/** Le stesse rotte che scripts/smoke-production.mjs deriva e passa a runChecks(). */
export const PAGES = smokeRoutes(expectedRoutes(readPageFiles(PAGES_DIR), PAGES_DIR))
