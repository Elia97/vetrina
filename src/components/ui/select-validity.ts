type ValidatedControl = Element & Pick<HTMLSelectElement, 'willValidate' | 'validity'>

const isValidated = (control: Element): control is ValidatedControl => 'willValidate' in control

function isFirstInvalidControl(native: HTMLSelectElement): boolean {
  if (!native.form) return true
  const firstInvalid = Array.from(native.form.elements)
    .filter(isValidated)
    .filter((control) => control.willValidate)
    .find((control) => !control.validity.valid)
  return firstInvalid === native
}

export function bindValidity(native: HTMLSelectElement, trigger: HTMLButtonElement): () => void {
  // Chromium non può mettere a fuoco il select nascosto: senza preventDefault scrive un errore
  // in console, e con o senza porta comunque il focus al campo non valido successivo.
  const onInvalid = (event: Event) => {
    event.preventDefault()
    trigger.setAttribute('aria-invalid', 'true')
    if (isFirstInvalidControl(native)) setTimeout(() => trigger.focus())
  }
  const onChange = () => {
    if (native.validity.valid) trigger.removeAttribute('aria-invalid')
  }

  native.addEventListener('invalid', onInvalid)
  native.addEventListener('change', onChange)

  return () => {
    native.removeEventListener('invalid', onInvalid)
    native.removeEventListener('change', onChange)
  }
}
