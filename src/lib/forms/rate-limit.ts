// Stato per istanza: si azzera agli avvii a freddo e non è condiviso fra le istanze
// serverless — uno strato anti-abuso di base, non una quota (docs/guides/forms-email.md).
const WINDOW_MS = 60_000
const MAX_HITS = 5
const hits = new Map<string, number[]>()

// [HARD] La mappa va spazzata: sotto Fluid Compute un'istanza serve molte richieste, quindi
// gli IP che ruotano la fanno crescere senza limite e senza nessun errore che lo mostri.
const MAX_TRACKED_KEYS = 5_000

function sweepExpired(now: number, windowMs: number): void {
  for (const [key, timestamps] of hits) {
    const newest = timestamps[timestamps.length - 1]
    if (newest === undefined || now - newest >= windowMs) hits.delete(key)
  }
}

export function rateLimit(key: string, max = MAX_HITS, windowMs = WINDOW_MS): boolean {
  const now = Date.now()
  if (hits.size > MAX_TRACKED_KEYS) sweepExpired(now, windowMs)
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs)
  if (recent.length >= max) {
    hits.set(key, recent)
    return false
  }
  recent.push(now)
  hits.set(key, recent)
  return true
}

export function resetRateLimit(): void {
  hits.clear()
}

/** La spazzata è invisibile ad allow e deny: a distinguerle è solo la dimensione della mappa. */
export function trackedKeyCount(): number {
  return hits.size
}
