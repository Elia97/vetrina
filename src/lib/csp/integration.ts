import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { AstroIntegration } from 'astro'

import { buildCspContent } from './directives'
import { collectInlineScriptHashes, injectCspMeta } from './html'

function walkHtml(dir: string): string[] {
  const out: string[] = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) out.push(...walkHtml(full))
    else if (entry.name.endsWith('.html')) out.push(full)
  }
  return out
}

// La `security.csp` nativa di Astro calcola l'hash anche degli stili, rompendo ogni `<style>`
// con ambito. Copre solo l'HTML prerenderizzato: docs/guides/deploy-ops.md § Content-Security-Policy.
export function cspIntegration(): AstroIntegration {
  return {
    name: 'csp-hashes',
    hooks: {
      'astro:build:done': ({ dir, logger }) => {
        const files = walkHtml(fileURLToPath(dir))
        const sources = new Map<string, string>()
        const union = new Set<string>()
        // La sessione è governata dalla CSP in meta della prima pagina caricata, quindi ogni
        // pagina porta l'unione: ClientRouter scambia la `<head>`, non la policy.
        for (const file of files) {
          const html = readFileSync(file, 'utf-8')
          sources.set(file, html)
          for (const hash of collectInlineScriptHashes(html)) union.add(hash)
        }
        const csp = buildCspContent([...union].sort())
        let injected = 0
        for (const [file, html] of sources) {
          const next = injectCspMeta(html, csp)
          if (next !== html) {
            writeFileSync(file, next)
            injected += 1
          }
        }
        logger.info(`CSP: ${union.size} inline hashes on ${injected}/${files.length} pages`)
      },
    },
  }
}
