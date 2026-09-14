/** Con `<ClientRouter />`, `astro:page-load` scatta anche al caricamento iniziale, quindi su
 *  un caricamento a freddo `setup` gira due volte e deve essere idempotente. */
export function createMotionBinding(setup: () => void, cleanup: () => void): () => void {
  let bound = false
  return (): void => {
    setup()
    if (bound) return
    bound = true
    document.addEventListener('astro:page-load', setup)
    document.addEventListener('astro:before-swap', cleanup)
  }
}
