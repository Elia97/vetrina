// `<ClientRouter />` ripristina il focus solo dentro i sottoalberi
// `[data-astro-transition-persist]`, che qui non esistono: uno scambio lo butta su <body> (WCAG 2.4.3).

const MAIN_ID = 'main-content'

function focusMain(): void {
  if (window.location.hash) return
  const main = document.getElementById(MAIN_ID)
  if (!main) return
  // `main` porta tabindex="-1" da src/layouts/main.astro: senza, focus() su un elemento
  // non interattivo non fa niente, in silenzio.
  main.focus({ preventScroll: true })
}

let bound = false

/** `astro:after-swap`, non `astro:page-load`: l'annunciatore di rotta di Astro parla 60ms
 *  dopo page-load, e spostare il fuoco a metà annuncio lo tronca. */
export function bindRouteFocus(): void {
  if (bound) return
  bound = true
  document.addEventListener('astro:after-swap', focusMain)
}
