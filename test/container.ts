import type { SSRManifest } from 'astro'
import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import { Window } from 'happy-dom'

// [HARD] Chi chiama gira sotto `environment: 'node'`: con happy-dom, Vite risolve `astro`
// con le condizioni browser e il render fallisce con `NoMatchingRenderer`.

type Container = Awaited<ReturnType<typeof AstroContainer.create>>
type Renderable = Parameters<Container['renderToString']>[0]
type RenderOptions = NonNullable<Parameters<Container['renderToString']>[1]>

export async function renderToString(
  component: Renderable,
  options?: RenderOptions,
  manifest?: Partial<SSRManifest>,
): Promise<string> {
  const container = await AstroContainer.create(manifest ? { manifest: manifest as SSRManifest } : {})
  return container.renderToString(component, options)
}

export async function renderToFragment(
  component: Renderable,
  options?: RenderOptions,
  manifest?: Partial<SSRManifest>,
): Promise<Window['document']> {
  const html = await renderToString(component, options, manifest)
  const window = new Window()
  window.document.body.innerHTML = html
  return window.document
}
