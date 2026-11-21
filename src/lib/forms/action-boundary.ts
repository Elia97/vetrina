// biome-ignore lint/style/noRestrictedImports: è il solo punto da cui un'azione nasce dal defineAction di Astro
import { type ActionAPIContext, ActionError, defineAction, isActionError } from 'astro:actions'
import type { z } from 'astro/zod'

import { useTranslations } from '@/i18n/translate'

type LocalizedSchema = z.ZodType<{ locale: string }>

type AstroActionHandler<TInput extends LocalizedSchema, TOutput> = Parameters<
  typeof defineAction<TOutput, 'json', TInput>
>[0]['handler']

type SafeHandler<TInput extends LocalizedSchema, TOutput> = (
  input: z.infer<TInput>,
  context: ActionAPIContext,
) => Promise<TOutput>

// [HARD] Un errore che arriva ad Astro come non ActionError esce nel corpo del 500 con il suo
// message e senza log (callSafely e serializeActionResult in astro/dist/actions/runtime/server.js).
function guardHandler<TInput extends LocalizedSchema, TOutput>(
  scope: string,
  handler: SafeHandler<TInput, TOutput>,
): SafeHandler<TInput, TOutput> {
  return async (input, context) => {
    try {
      return await handler(input, context)
    } catch (error) {
      if (isActionError(error)) throw error
      console.error(`[${scope}] unhandled error:`, error)
      throw new ActionError({
        code: 'INTERNAL_SERVER_ERROR',
        message: useTranslations(input.locale)('forms.action.unexpected'),
      })
    }
  }
}

export function defineSafeAction<TInput extends LocalizedSchema, TOutput>(
  scope: string,
  { input, handler }: { input: TInput; handler: SafeHandler<TInput, TOutput> },
) {
  return defineAction({
    accept: 'json',
    input,
    handler: guardHandler(scope, handler) as AstroActionHandler<TInput, TOutput>,
  })
}
