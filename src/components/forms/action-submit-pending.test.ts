// @vitest-environment happy-dom
import { buildForm, submitButton, successBox } from '@test/helpers/action-form-dom'
import { describe, expect, it, vi } from 'vitest'

import { createActionFormBinding } from './action-submit'

describe("mentre l'invio è in corso", () => {
  function pendingSubmit() {
    let finish: (result: { error?: unknown }) => void = () => {}
    const submit = vi.fn(
      () =>
        new Promise<{ error?: unknown }>((resolve) => {
          finish = resolve
        }),
    )
    const form = buildForm()
    createActionFormBinding({ formSelector: '[data-contact-form]', buildPayload: () => ({}), submit })()
    submitButton(form).focus()
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
    return { form, submit, finish: () => finish({}) }
  }

  it('il pulsante resta focalizzabile e si dichiara aria-disabled', () => {
    const { form } = pendingSubmit()

    expect(submitButton(form).disabled).toBe(false)
    expect(submitButton(form).getAttribute('aria-disabled')).toBe('true')
    expect(document.activeElement).toBe(submitButton(form))
  })

  it("un secondo invio non richiama l'azione e non porta il browser altrove", () => {
    const { form, submit } = pendingSubmit()
    const second = new Event('submit', { bubbles: true, cancelable: true })

    form.dispatchEvent(second)

    expect(submit).toHaveBeenCalledTimes(1)
    expect(second.defaultPrevented).toBe(true)
  })

  it('alla fine toglie aria-disabled e lascia il focus sul pulsante', async () => {
    const { form, finish } = pendingSubmit()

    finish()

    await vi.waitFor(() => expect(submitButton(form).hasAttribute('aria-disabled')).toBe(false))
    expect(successBox(form).textContent).toBe('Request sent')
    expect(document.activeElement).toBe(submitButton(form))
  })
})
