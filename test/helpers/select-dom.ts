function selectMarkup(id: string, required: boolean): string {
  return `
    <label for="${id}">Argomento</label>
    <div class="relative" data-select-root>
      <select class="flex" data-select-native id="${id}" name="${id}"${required ? ' required' : ''}
              aria-describedby="${id}-error">
        <option value="" disabled>Scegli</option>
        <option value="consulenza">Consulenza</option>
        <option value="preventivo">Preventivo</option>
      </select>
      <button type="button" role="combobox" data-select-trigger aria-haspopup="listbox" aria-expanded="false" class="hidden">
        <span data-select-value></span>
      </button>
      <ul role="listbox" data-select-listbox class="hidden">
        <li role="option" data-value="consulenza" aria-selected="false" tabindex="-1">Consulenza</li>
        <li role="option" data-value="preventivo" aria-selected="false" tabindex="-1">Preventivo</li>
      </ul>
    </div>
    <p id="${id}-error">Campo obbligatorio</p>`
}

// Leggendo innerHTML, happy-dom ignora un attributo `selected` e riporta la prima opzione
// abilitata, quindi il valore corrente si assegna a mano.
function mount(html: string, value: string): void {
  document.body.innerHTML = html
  const control = document.querySelector<HTMLSelectElement>('[data-select-native]')
  if (control) control.value = value
}

export function renderSelect({ value = '', required = true } = {}): void {
  mount(selectMarkup('topic', required), value)
}

export function renderSelectInForm(before = ''): void {
  mount(`<form>${before}${selectMarkup('topic', true)}</form>`, '')
}

export function appendSelectRoot(id: string): HTMLElement {
  document.body.insertAdjacentHTML('beforeend', selectMarkup(id, true))
  return document.getElementById(id)?.closest('[data-select-root]') as HTMLElement
}

export async function activate(): Promise<void> {
  const { bindSelects } = await import('@/components/ui/select-behavior')
  bindSelects()
}

export const trigger = (): HTMLButtonElement => document.querySelector('[data-select-trigger]') as HTMLButtonElement
export const native = (): HTMLSelectElement => document.querySelector('[data-select-native]') as HTMLSelectElement
export const listbox = (): HTMLElement => document.querySelector('[data-select-listbox]') as HTMLElement
export const options = (): HTMLElement[] => Array.from(listbox().querySelectorAll<HTMLElement>('[role="option"]'))
export const isOpen = (): boolean => trigger().getAttribute('aria-expanded') === 'true'
export const key = (el: Element, k: string): void => {
  el.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }))
}
