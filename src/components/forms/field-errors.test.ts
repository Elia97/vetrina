// @vitest-environment happy-dom
import { activate, native, renderSelectInForm, trigger } from '@test/helpers/select-dom'
import { beforeEach, describe, expect, it } from 'vitest'

import { HONEYPOT_FIELD } from '@/lib/forms/honeypot'

import {
  applyFieldErrors,
  clearFieldErrorOnInput,
  clearFieldErrors,
  fieldErrorId,
  focusFirstInvalid,
} from './field-errors'

function buildForm(): HTMLFormElement {
  document.body.innerHTML = `
    <form>
      <input name="email" aria-describedby="${fieldErrorId('email')}" aria-invalid="false" />
      <p id="${fieldErrorId('email')}" data-field-error="email"></p>
      <textarea name="message" aria-describedby="${fieldErrorId('message')}" aria-invalid="false"></textarea>
      <p id="${fieldErrorId('message')}" data-field-error="message"></p>
      <input name="${HONEYPOT_FIELD}" />
    </form>`
  const form = document.querySelector('form')
  if (!form) throw new Error('fixture form missing')
  return form
}

let form: HTMLFormElement

beforeEach(() => {
  form = buildForm()
})

const slot = (field: string) => form.querySelector(`[data-field-error="${field}"]`)
const control = (name: string) => form.querySelector(`[name="${name}"]`)

describe('applyFieldErrors', () => {
  it('writes each message into its own slot and marks the control invalid', () => {
    const result = applyFieldErrors(form, { email: ['Email non valida'] })
    expect(result.matched).toBe(true)
    expect(slot('email')?.textContent).toBe('Email non valida')
    expect(control('email')?.getAttribute('aria-invalid')).toBe('true')
  })

  it('leaves untouched fields alone', () => {
    applyFieldErrors(form, { email: ['Email non valida'] })
    expect(slot('message')?.textContent).toBe('')
    expect(control('message')?.getAttribute('aria-invalid')).toBe('false')
  })

  it('never surfaces a honeypot error, in a slot or form-level', () => {
    const result = applyFieldErrors(form, { [HONEYPOT_FIELD]: ['Campo non valido'] })
    expect(result).toEqual({ matched: false, unmatched: [] })
    expect(control(HONEYPOT_FIELD)?.hasAttribute('aria-invalid')).toBe(false)
  })

  it('hands back messages that have no slot, for the form-level alert', () => {
    const result = applyFieldErrors(form, { nickname: ['Campo sconosciuto'] })
    expect(result).toEqual({ matched: false, unmatched: ['Campo sconosciuto'] })
  })

  it('reports only the first message of a field', () => {
    applyFieldErrors(form, { email: ['Prima', 'Seconda'] })
    expect(slot('email')?.textContent).toBe('Prima')
  })
})

describe('clearFieldErrors', () => {
  it('empties every slot and turns every aria-invalid back to false', () => {
    applyFieldErrors(form, { email: ['Email non valida'], message: ['Troppo lungo'] })
    clearFieldErrors(form)
    expect(slot('email')?.textContent).toBe('')
    expect(control('email')?.getAttribute('aria-invalid')).toBe('false')
    expect(control('message')?.getAttribute('aria-invalid')).toBe('false')
    expect(control(HONEYPOT_FIELD)?.hasAttribute('aria-invalid')).toBe(false)
  })
})

describe('clearFieldErrorOnInput', () => {
  let editForm: HTMLFormElement

  beforeEach(() => {
    document.body.innerHTML = `
      <form>
        <input name="email" type="email" required aria-describedby="${fieldErrorId('email')}" aria-invalid="false" />
        <p id="${fieldErrorId('email')}" data-field-error="email"></p>
        <input name="consent" type="checkbox" required aria-describedby="${fieldErrorId('consent')}" aria-invalid="false" />
        <p id="${fieldErrorId('consent')}" data-field-error="consent"></p>
      </form>`
    editForm = document.querySelector('form') as HTMLFormElement
    editForm.addEventListener('input', clearFieldErrorOnInput)
  })

  const field = (name: string) => editForm.querySelector(`[name="${name}"]`) as HTMLInputElement
  const message = (name: string) => editForm.querySelector(`[data-field-error="${name}"]`)?.textContent
  const typeInto = (name: string, value: string) => {
    field(name).value = value
    field(name).dispatchEvent(new Event('input', { bubbles: true }))
  }

  it('clears a text field error once the value turns valid', () => {
    applyFieldErrors(editForm, { email: ['Email non valida'] })
    typeInto('email', 'ada@example.com')
    expect(message('email')).toBe('')
    expect(field('email').getAttribute('aria-invalid')).toBe('false')
  })

  it('clears the consent error once the box is checked', () => {
    applyFieldErrors(editForm, { consent: ['Serve il consenso'] })
    field('consent').checked = true
    field('consent').dispatchEvent(new Event('input', { bubbles: true }))
    expect(message('consent')).toBe('')
    expect(field('consent').getAttribute('aria-invalid')).toBe('false')
  })

  it('keeps the error while the value is still invalid', () => {
    applyFieldErrors(editForm, { email: ['Email non valida'] })
    typeInto('email', 'ada@')
    expect(message('email')).toBe('Email non valida')
    expect(field('email').getAttribute('aria-invalid')).toBe('true')
  })

  it('shows no new error on a field typed invalid before any submit', () => {
    typeInto('email', 'ada@')
    expect(message('email')).toBe('')
    expect(field('email').getAttribute('aria-invalid')).toBe('false')
  })

  it('ignores a control with no error slot', () => {
    editForm.insertAdjacentHTML('beforeend', `<input name="${HONEYPOT_FIELD}" />`)
    typeInto(HONEYPOT_FIELD, 'bot')
    expect(field(HONEYPOT_FIELD).hasAttribute('aria-invalid')).toBe(false)
  })

  it('leaves the other fields in error alone', () => {
    applyFieldErrors(editForm, { email: ['Email non valida'], consent: ['Serve il consenso'] })
    typeInto('email', 'ada@example.com')
    expect(message('consent')).toBe('Serve il consenso')
    expect(field('consent').getAttribute('aria-invalid')).toBe('true')
  })
})

describe('focusFirstInvalid', () => {
  it('focuses the first invalid control in DOM order', () => {
    applyFieldErrors(form, { message: ['Troppo lungo'], email: ['Email non valida'] })
    expect(focusFirstInvalid(form)).toBe(true)
    expect(document.activeElement).toBe(control('email'))
  })

  it('reports that there was nothing to focus', () => {
    expect(focusFirstInvalid(form)).toBe(false)
  })
})

describe('con un ui/select attivo', () => {
  it('segna il trigger, non il select nativo nascosto, e gli porta il focus', async () => {
    renderSelectInForm()
    await activate()
    const selectForm = document.querySelector('form') as HTMLFormElement

    applyFieldErrors(selectForm, { topic: ['Pick a topic'] })

    expect(trigger().getAttribute('aria-invalid')).toBe('true')
    expect(native().hasAttribute('aria-invalid')).toBe(false)
    expect(focusFirstInvalid(selectForm)).toBe(true)
    expect(document.activeElement).toBe(trigger())
  })
})
