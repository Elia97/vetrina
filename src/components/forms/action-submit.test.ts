// @vitest-environment happy-dom
import {
  buildForm,
  errorBox,
  inputError,
  slot,
  submitButton,
  submitWith,
  successBox,
} from '@test/helpers/action-form-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createActionFormBinding } from './action-submit'

beforeEach(() => {
  vi.restoreAllMocks()
})

// Un 413 oltre actionBodySizeLimit arriva al client come eccezione, non come `{ error }`.
describe('a submit that throws', () => {
  it('leaves the button usable and reports the failure', async () => {
    const form = await submitWith(
      {},
      vi.fn(() => Promise.reject(new Error('Content too large'))),
    )

    expect(submitButton(form).disabled).toBe(false)
    expect(errorBox(form).textContent).toBe('Invio non riuscito')
    expect(errorBox(form).textContent).not.toContain('Content too large')
  })

  it('shows the dictionary message for a network failure, never the browser text', async () => {
    const form = await submitWith(
      {},
      vi.fn(() => Promise.reject(new TypeError('Failed to fetch'))),
    )

    expect(errorBox(form).textContent).toBe('Invio non riuscito')
  })
})

describe('successful submit', () => {
  it("svuota il form e gli errori di campo, e scrive il messaggio d'esito", async () => {
    const form = await submitWith({})
    form.querySelector<HTMLInputElement>('[name="email"]')?.setAttribute('value', 'a@b.test')

    expect(successBox(form).textContent).toBe('Request sent')
    expect(errorBox(form).textContent).toBe('')
    expect(slot(form, 'email').textContent).toBe('')
  })

  it("svuota la conferma quando parte l'invio successivo, e la riscrive", async () => {
    const form = await submitWith({})

    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
    expect(successBox(form).textContent).toBe('')

    await vi.waitFor(() => expect(successBox(form).textContent).toBe('Request sent'))
  })

  it('re-enables the submit button and restores its label', async () => {
    const form = await submitWith({})

    expect(submitButton(form).disabled).toBe(false)
    expect(submitButton(form).textContent).toBe('Invia')
  })
})

describe('validation errors land on their field', () => {
  it('fills the field slot and marks the control invalid', async () => {
    const form = await submitWith({ error: inputError({ email: ['Email non valida'] }) })

    expect(slot(form, 'email').textContent).toBe('Email non valida')
    expect(form.querySelector('[name="email"]')?.getAttribute('aria-invalid')).toBe('true')
  })

  it('stays silent at form level when every message found a slot', async () => {
    const form = await submitWith({ error: inputError({ email: ['Email non valida'] }) })

    expect(errorBox(form).textContent).toBe('')
  })

  it('speaks at form level for a message with no slot to land in', async () => {
    const form = await submitWith({ error: inputError({ captcha: ['Verifica fallita'] }) })

    expect(errorBox(form).textContent).toBe('Verifica fallita')
  })

  it('moves focus to the first invalid control', async () => {
    const form = await submitWith({ error: inputError({ message: ['Troppo corto'] }) })

    expect(document.activeElement).toBe(form.querySelector('[name="message"]'))
  })
})

describe('non-validation errors', () => {
  it("shows the action's own message when it carries one", async () => {
    const form = await submitWith({ error: { message: 'Troppe richieste' } })

    expect(errorBox(form).textContent).toBe('Troppe richieste')
  })

  it('falls back to the generic message when the error carries none', async () => {
    const form = await submitWith({ error: 'boom' })

    expect(errorBox(form).textContent).toBe('Errore generico')
  })

  it("svuota l'errore precedente quando parte l'invio successivo", async () => {
    const form = await submitWith({ error: { message: 'Too many requests' } })

    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))

    expect(errorBox(form).textContent).toBe('')
  })
})

describe('a field corrected after the submit', () => {
  const correctEmail = (form: HTMLFormElement) => {
    const email = form.querySelector('[name="email"]') as HTMLInputElement
    email.value = 'ada@example.com'
    email.dispatchEvent(new Event('input', { bubbles: true }))
  }

  it('drops its error as the user types', async () => {
    const form = await submitWith({ error: inputError({ email: ['Email non valida'] }) })

    correctEmail(form)

    expect(slot(form, 'email').textContent).toBe('')
    expect(form.querySelector('[name="email"]')?.getAttribute('aria-invalid')).toBe('false')
  })

  it('keeps its error once the binding is gone', async () => {
    const form = await submitWith({ error: inputError({ email: ['Email non valida'] }) })

    document.dispatchEvent(new Event('astro:before-swap'))
    correctEmail(form)

    expect(slot(form, 'email').textContent).toBe('Email non valida')
  })
})

describe('binding lifecycle', () => {
  it('submits once per event even if setup runs twice', async () => {
    const form = buildForm()
    const submit = vi.fn((): Promise<{ error?: unknown }> => Promise.resolve({}))
    const bind = createActionFormBinding({ formSelector: '[data-contact-form]', buildPayload: () => ({}), submit })
    bind()
    bind()

    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
    await vi.waitFor(() => {
      expect(submit).toHaveBeenCalled()
    })

    expect(submit).toHaveBeenCalledTimes(1)
  })

  it('unbinds on astro:before-swap', async () => {
    const form = buildForm()
    const submit = vi.fn((): Promise<{ error?: unknown }> => Promise.resolve({}))
    createActionFormBinding({ formSelector: '[data-contact-form]', buildPayload: () => ({}), submit })()

    document.dispatchEvent(new Event('astro:before-swap'))
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
    await Promise.resolve()

    expect(submit).not.toHaveBeenCalled()
  })

  it('prevents the browser from navigating away', async () => {
    const form = buildForm()
    createActionFormBinding({
      formSelector: '[data-contact-form]',
      buildPayload: () => ({}),
      submit: vi.fn((): Promise<{ error?: unknown }> => Promise.resolve({})),
    })()

    const event = new Event('submit', { bubbles: true, cancelable: true })
    form.dispatchEvent(event)

    expect(event.defaultPrevented).toBe(true)
  })

  it('abilita il pulsante di invio che il markup consegna disabilitato', () => {
    const form = buildForm()
    submitButton(form).disabled = true

    createActionFormBinding({
      formSelector: '[data-contact-form]',
      buildPayload: () => ({}),
      submit: vi.fn((): Promise<{ error?: unknown }> => Promise.resolve({})),
    })()

    expect(submitButton(form).disabled).toBe(false)
    expect(submitButton(form).textContent).toBe('Invia')
  })
})
