const NAMING_ATTRIBUTES = ['aria-describedby', 'aria-label', 'aria-labelledby'] as const

let generatedListboxes = 0

function moveAttribute(from: Element, to: Element, name: string): void {
  const value = from.getAttribute(name)
  if (!value) return
  from.removeAttribute(name)
  to.setAttribute(name, value)
}

export function adoptNativeRelationships(
  native: HTMLSelectElement,
  trigger: HTMLButtonElement,
  listbox: HTMLElement,
): void {
  const id = native.getAttribute('id')
  if (id) {
    native.removeAttribute('id')
    trigger.id = id
  }
  listbox.id = id ? `${id}-listbox` : `ui-select-listbox-${++generatedListboxes}`
  trigger.setAttribute('aria-controls', listbox.id)
  for (const name of NAMING_ATTRIBUTES) moveAttribute(native, trigger, name)
  if (native.required) trigger.setAttribute('aria-required', 'true')
  trigger.disabled = native.disabled
}

export function markSelectedOption(listbox: HTMLElement | null, option: HTMLElement): void {
  /* v8 ignore next -- ogni chiamante passa la listbox che findSelectElements ha risolto */
  for (const item of listbox?.querySelectorAll<HTMLElement>('[role="option"]') ?? []) {
    item.setAttribute('aria-selected', String(item === option))
  }
}

// select-listbox.astro renderizza ogni opzione con `aria-selected="false"` in SSR.
export function markSelectedValue(listbox: HTMLElement, value: string): void {
  const current = Array.from(listbox.querySelectorAll<HTMLElement>('[role="option"]')).find(
    (item) => item.dataset.value === value,
  )
  if (current) markSelectedOption(listbox, current)
}
