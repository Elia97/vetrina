import { HONEYPOT_FIELD } from '@/lib/forms/honeypot'

// Riempie gli slot `[data-field-error]` renderizzati da ui/field/error.astro.

export type FieldErrorResult = {
  matched: boolean
  unmatched: string[]
}

export function fieldErrorId(field: string): string {
  return `${field}-error`
}

const NOT_INVALID = 'false'

// Firefox e Safari espongono come non valido un `required` vuoto senza aria-invalid, e il lettore lo annuncia subito.
export function fieldErrorAttributes(field: string) {
  return { 'aria-describedby': fieldErrorId(field), 'aria-invalid': NOT_INVALID } as const
}

function controlFor(form: HTMLFormElement, name: string): HTMLElement | null {
  return form.querySelector<HTMLElement>(`[aria-describedby~="${fieldErrorId(name)}"]`)
}

export function clearFieldErrors(form: HTMLFormElement): void {
  for (const slot of form.querySelectorAll<HTMLElement>('[data-field-error]')) slot.textContent = ''
  for (const control of form.querySelectorAll('[aria-invalid="true"]'))
    control.setAttribute('aria-invalid', NOT_INVALID)
}

type ValidatedControl = Element & Pick<HTMLInputElement, 'form' | 'name' | 'validity'>

const isValidatedControl = (target: EventTarget | null): target is ValidatedControl =>
  target instanceof Element && 'validity' in target

export function clearFieldErrorOnInput(event: Event): void {
  const { target } = event
  if (!isValidatedControl(target) || !target.form || !target.validity.valid) return
  const control = controlFor(target.form, target.name)
  if (control?.getAttribute('aria-invalid') !== 'true') return
  control.setAttribute('aria-invalid', NOT_INVALID)
  for (const slot of target.form.querySelectorAll(`[data-field-error="${target.name}"]`)) slot.textContent = ''
}

// Mostrare l'errore dell'honeypot direbbe a un bot quale campo lo ha tradito, quindi si scarta.
export function applyFieldErrors(
  form: HTMLFormElement,
  fields: Readonly<Record<string, string[] | undefined>>,
): FieldErrorResult {
  const result: FieldErrorResult = { matched: false, unmatched: [] }
  for (const [name, messages] of Object.entries(fields)) {
    const message = messages?.[0]
    if (!message || name === HONEYPOT_FIELD) continue
    const slot = form.querySelector<HTMLElement>(`[data-field-error="${name}"]`)
    if (!slot) {
      result.unmatched.push(message)
      continue
    }
    slot.textContent = message
    result.matched = true
    controlFor(form, name)?.setAttribute('aria-invalid', 'true')
  }
  return result
}

export function focusFirstInvalid(form: HTMLFormElement): boolean {
  const control = form.querySelector<HTMLElement>('[aria-invalid="true"]')
  if (!control) return false
  control.focus()
  return true
}
