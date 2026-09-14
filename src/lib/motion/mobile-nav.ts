import { lockScroll, unlockScroll } from '@/lib/overlay/scroll-lock'
import { cycleFocus } from '@/lib/overlay/trap-focus'

import { createMotionBinding } from './binding'
import { onDesktopViewportChange } from './media-queries'

const FOCUSABLE_SELECTOR = 'a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])'

let isOpen = false
let lastFocused: HTMLElement | null = null
const cleanups: Array<() => void> = []

function focusableElements(panel: HTMLElement): HTMLElement[] {
  return Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (element) => element.offsetParent !== null,
  )
}

// `aria-modal` è indicativo: il cursore virtuale di un lettore di schermo scorre comunque
// nella pagina sotto, e la trappola del Tab non se ne accorge perché nessun focus si muove.
function setBackgroundInert(panel: HTMLElement, inert: boolean): void {
  for (const sibling of Array.from(document.body.children)) {
    if (sibling === panel || !(sibling instanceof HTMLElement)) continue
    sibling.inert = inert
  }
}

function openMenu(panel: HTMLElement, toggle: HTMLButtonElement): void {
  /* v8 ignore next -- document.activeElement al peggio è <body>, mai un non-elemento */
  lastFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null
  panel.hidden = false
  toggle.setAttribute('aria-expanded', 'true')
  setBackgroundInert(panel, true)
  lockScroll()
  isOpen = true
  // preventScroll su entrambe le chiamate: senza, il pannello fa scorrere il proprio contenitore
  // all'apertura e alla chiusura la pagina salta al bersaglio del focus, ormai fuori schermo.
  focusableElements(panel)[0]?.focus({ preventScroll: true })
}

function closeMenu(panel: HTMLElement, toggle: HTMLButtonElement): void {
  panel.hidden = true
  toggle.setAttribute('aria-expanded', 'false')
  // Prima del focus qui sotto: un elemento inert rifiuta il fuoco in silenzio.
  setBackgroundInert(panel, false)
  if (isOpen) unlockScroll()
  isOpen = false
  ;(lastFocused ?? toggle).focus({ preventScroll: true })
}

function bindMobileNavHandlers(panel: HTMLElement, toggle: HTMLButtonElement): () => void {
  const onToggleClick = (): void => {
    if (panel.hidden) openMenu(panel, toggle)
    else closeMenu(panel, toggle)
  }

  const onPanelClick = (event: MouseEvent): void => {
    /* v8 ignore next -- delegato dal pannello, i cui figli sono tutti elementi */
    if (!(event.target instanceof Element)) return
    if (event.target.closest('a[href], [data-mobile-nav-close]')) closeMenu(panel, toggle)
  }

  const onPanelKeydown = (event: KeyboardEvent): void => {
    if (panel.hidden) return
    if (event.key === 'Escape') {
      event.preventDefault()
      closeMenu(panel, toggle)
      return
    }
    if (event.key === 'Tab') cycleFocus(focusableElements(panel), event)
  }

  // Pannello e interruttore sono entrambi `md:hidden`, e un telefono in orizzontale supera il
  // breakpoint di 768px (un 14 Pro è largo 852px) col cassetto che tiene ancora bloccata la pagina.
  const stopViewportWatch = onDesktopViewportChange((isDesktop) => {
    if (isDesktop && !panel.hidden) closeMenu(panel, toggle)
  })

  toggle.addEventListener('click', onToggleClick)
  panel.addEventListener('click', onPanelClick)
  panel.addEventListener('keydown', onPanelKeydown)

  return () => {
    stopViewportWatch()
    toggle.removeEventListener('click', onToggleClick)
    panel.removeEventListener('click', onPanelClick)
    panel.removeEventListener('keydown', onPanelKeydown)
  }
}

function setupMobileNav(): void {
  const panel = document.querySelector<HTMLElement>('[data-mobile-nav]')
  const toggle = document.querySelector<HTMLButtonElement>('[data-mobile-nav-toggle]')
  // createMotionBinding esegue setup due volte a caricamento freddo.
  if (!panel || !toggle || panel.dataset.mobileNavReady !== undefined) return
  panel.dataset.mobileNavReady = ''

  panel.hidden = true
  toggle.setAttribute('aria-expanded', 'false')
  cleanups.push(bindMobileNavHandlers(panel, toggle))
}

function cleanupMobileNav(): void {
  for (const cleanup of cleanups.splice(0)) cleanup()
  const panel = document.querySelector<HTMLElement>('[data-mobile-nav]')
  if (panel) {
    delete panel.dataset.mobileNavReady
    panel.hidden = true
    setBackgroundInert(panel, false)
  }
  if (isOpen) unlockScroll()
  isOpen = false
  lastFocused = null
}

export const bindMobileNav = createMotionBinding(setupMobileNav, cleanupMobileNav)
