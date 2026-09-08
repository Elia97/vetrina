/** [HARD] `prefers-reduced-motion: reduce` disattiva TUTTE le animazioni: è la prima riga di
 *  ogni impostazione di animazione. */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return true
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

// [HARD] 768px è il breakpoint `md` di Tailwind, dove il drawer mobile si nasconde.
const DESKTOP_QUERY = '(min-width: 768px)'

export function isDesktopViewport(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia(DESKTOP_QUERY).matches
}

export function onDesktopViewportChange(listener: (isDesktop: boolean) => void): () => void {
  if (typeof window === 'undefined') return () => {}
  const query = window.matchMedia(DESKTOP_QUERY)
  const handler = (event: MediaQueryListEvent): void => listener(event.matches)
  query.addEventListener('change', handler)
  return () => query.removeEventListener('change', handler)
}

export function hasFinePointer(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(hover: hover) and (pointer: fine)').matches
}
