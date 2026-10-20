import { HONEYPOT_FIELD } from '@/lib/forms/honeypot'

// Riempie gli slot `[data-field-error]` renderizzati da ui/field/error.astro.

export type FieldErrorResult = {
  matched: boolean
  unmatched: string[]
}

export function fieldErrorId(field: string): string {
  return `${field}-error`
}

function controlFor(form: HTMLFormElement, name: string): HTMLElement | null {
  return form.querySelector<HTMLElement>(`[aria-describedby~="${fieldErrorId(name)}"]`)
}

export function clearFieldErrors(form: HTMLFormElement): void {
  for (const slot of form.querySelectorAll<HTMLElement>('[data-field-error]')) slot.textContent = ''
  for (const control of form.querySelectorAll('[aria-invalid]')) control.removeAttribute('aria-invalid')
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
