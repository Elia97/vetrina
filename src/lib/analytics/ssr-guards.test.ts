// Di proposito NON happy-dom: una window finta annullerebbe quello che queste guardie dimostrano.
import { describe, expect, it } from 'vitest'

describe('analytics modules are importable without a window', () => {
  it('pushToDataLayer no-ops instead of throwing', async () => {
    const { pushToDataLayer } = await import('@/lib/analytics/data-layer')

    expect(() => {
      pushToDataLayer({ event: 'test' })
    }).not.toThrow()
  })

  // reveal.ts registra un listener matchMedia al momento dell'import.
  it('the reveal module imports cleanly', async () => {
    await expect(import('@/lib/motion/reveal')).resolves.toBeDefined()
  })
})
