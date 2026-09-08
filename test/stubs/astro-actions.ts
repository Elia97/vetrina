// Ricopiato alla lettera da node_modules/astro/dist/actions/runtime/client.js.
export function isInputError(
  error?: unknown,
): error is { type: 'AstroActionInputError'; issues: unknown[]; fields: Record<string, string[] | undefined> } {
  return (
    typeof error === 'object' &&
    error != null &&
    'type' in error &&
    error.type === 'AstroActionInputError' &&
    'issues' in error &&
    Array.isArray(error.issues)
  )
}

// Stessa fonte, meno `status` e `codeToStatus`: in uscita il runtime deriva lo stato HTTP
// dalla mappa dei codici IANA, e niente di ciò che è in prova lo legge.
export class ActionError extends Error {
  readonly type = 'AstroActionError'
  readonly code: string

  constructor(params: { code: string; message?: string }) {
    super(params.message)
    this.code = params.code
  }
}

export const actions = {
  contact: (_payload: unknown): Promise<{ error?: unknown }> =>
    Promise.reject(new Error('astro:actions stub: actions.contact was called without being stubbed')),
}

export function defineAction<T>(params: T): T {
  return params
}
