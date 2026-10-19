// @vitest-environment happy-dom
import { activate, listbox, native, renderSelect, renderSelectInForm, trigger } from '@test/helpers/select-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

beforeEach(() => {
  vi.resetModules()
})

afterEach(() => {
  document.body.innerHTML = ''
})

const nextTask = () => new Promise((resolve) => setTimeout(resolve))

describe('un select obbligatorio che non passa la validazione del browser', () => {
  it('segna il trigger come non valido', async () => {
    renderSelectInForm()
    await activate()

    expect(native().checkValidity()).toBe(false)
    expect(trigger().getAttribute('aria-invalid')).toBe('true')
  })

  it('porta il focus sul trigger quando è il primo campo non valido del form', async () => {
    renderSelectInForm('<input name="note">')
    await activate()

    native().checkValidity()
    await nextTask()

    expect(document.activeElement).toBe(trigger())
  })

  it("lascia il focus al browser quando prima c'è un campo non valido", async () => {
    renderSelectInForm('<input name="note" required>')
    await activate()

    native().checkValidity()
    await nextTask()

    expect(document.activeElement).not.toBe(trigger())
    expect(trigger().getAttribute('aria-invalid')).toBe('true')
  })

  it('fuori da un form porta il focus sul trigger', async () => {
    renderSelect()
    await activate()

    native().checkValidity()
    await nextTask()

    expect(document.activeElement).toBe(trigger())
  })
})

describe('il trigger torna valido con il select', () => {
  it('dopo una scelta valida', async () => {
    renderSelectInForm()
    await activate()
    native().checkValidity()

    trigger().click()
    listbox().querySelector<HTMLElement>('[data-value="consulenza"]')?.click()

    expect(trigger().hasAttribute('aria-invalid')).toBe(false)
  })

  it('non su un change che lascia il campo vuoto', async () => {
    renderSelectInForm()
    await activate()
    native().checkValidity()

    native().dispatchEvent(new Event('change'))

    expect(trigger().getAttribute('aria-invalid')).toBe('true')
  })
})
