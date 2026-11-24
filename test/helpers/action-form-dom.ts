import { expect, vi } from 'vitest'

import { createActionFormBinding } from '@/components/forms/action-submit'
import { fieldErrorId } from '@/components/forms/field-errors'

// La forma che `astro:actions` produce davvero (rispecchiata da test/stubs/astro-actions.ts).
export function inputError(fields: Record<string, string[]>): unknown {
  return { type: 'AstroActionInputError', issues: [], fields }
}

export function buildForm(): HTMLFormElement {
  document.body.innerHTML = `
    <form data-contact-form
          data-i18n-submit="Invia"
          data-i18n-sending="Invio…"
          data-i18n-generic-error="Errore generico"
          data-i18n-send-failed="Invio non riuscito"
          data-i18n-success="Request sent">
      <input name="email" aria-describedby="${fieldErrorId('email')}" />
      <p id="${fieldErrorId('email')}" data-field-error="email"></p>
      <textarea name="message" aria-describedby="${fieldErrorId('message')}"></textarea>
      <p id="${fieldErrorId('message')}" data-field-error="message"></p>
      <p data-form-success role="status"></p>
      <p data-form-error role="alert"></p>
      <button type="submit">Invia</button>
    </form>`
  const form = document.querySelector('form')
  if (!form) throw new Error('fixture form missing')
  return form
}

export type SubmitSpy = (payload: unknown) => Promise<{ error?: unknown }>

export async function submitWith(result: { error?: unknown }, spy?: SubmitSpy): Promise<HTMLFormElement> {
  const form = buildForm()
  const submit = spy ?? vi.fn(() => Promise.resolve(result))
  createActionFormBinding({
    formSelector: '[data-contact-form]',
    buildPayload: (f) => ({ email: f.querySelector<HTMLInputElement>('[name="email"]')?.value ?? '' }),
    submit,
  })()
  form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
  await vi.waitFor(() => {
    expect(submit).toHaveBeenCalled()
  })
  await Promise.resolve()
  return form
}

export const successBox = (f: HTMLFormElement) => f.querySelector('[data-form-success]') as HTMLElement
export const errorBox = (f: HTMLFormElement) => f.querySelector('[data-form-error]') as HTMLElement
export const slot = (f: HTMLFormElement, field: string) =>
  f.querySelector(`[data-field-error="${field}"]`) as HTMLElement
export const submitButton = (f: HTMLFormElement) => f.querySelector('button[type="submit"]') as HTMLButtonElement
