import { execFileSync } from 'node:child_process'
import type { SitemapItem } from '@astrojs/sitemap'

import { crawlPathname } from './crawl-policy'

export type GitRunner = (args: readonly string[]) => string

export type LastmodSources = (pathname: string) => readonly string[] | undefined

const PAGE_SOURCES: Readonly<Record<string, readonly string[]>> = {
  '/': ['src/pages/index.astro', 'src/content/homepage'],
  '/contatti': ['src/pages/contatti.astro'],
  '/termini': ['src/pages/termini.astro'],
}

export const lastmodSources: LastmodSources = (pathname) => PAGE_SOURCES[pathname]

export const runGit: GitRunner = (args) =>
  execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })

function hasFullHistory(run: GitRunner): boolean {
  try {
    if (run(['rev-parse', '--is-shallow-repository']).trim() !== 'true') return true
    console.warn('[sitemap] lastmod omitted: a shallow clone dates every file to its boundary commit')
  } catch (error) {
    console.warn(`[sitemap] lastmod omitted: git history unavailable (${(error as Error).message})`)
  }
  return false
}

export function createLastmodResolver(
  sources: LastmodSources = lastmodSources,
  run: GitRunner = runGit,
): (url: string) => string | undefined {
  let fullHistory: boolean | undefined
  return (url) => {
    fullHistory ??= hasFullHistory(run)
    const paths = fullHistory ? sources(crawlPathname(url)) : undefined
    if (!paths) return undefined
    return run(['log', '-1', '--format=%cI', '--', ...paths]).trim() || undefined
  }
}

export function withLastmod(resolve: (url: string) => string | undefined): (item: SitemapItem) => SitemapItem {
  return (item) => {
    const lastmod = resolve(item.url)
    return lastmod ? { ...item, lastmod } : item
  }
}
