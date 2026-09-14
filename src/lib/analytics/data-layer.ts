// Il contratto dello snippet GTM: finché il container non si carica, la coda è un array
// normale che viene riprodotto al caricamento, quindi un push prima del consenso è sicuro.

export type DataLayerEvent = Record<string, unknown>

declare global {
  interface Window {
    dataLayer?: DataLayerEvent[]
  }
}

export function pushToDataLayer(event: DataLayerEvent): void {
  if (typeof window === 'undefined') return
  const queue = window.dataLayer ?? []
  queue.push(event)
  window.dataLayer = queue
}
