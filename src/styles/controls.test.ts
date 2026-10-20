import { renderToFragment } from '@test/container'
import { describe, expect, it } from 'vitest'

import Button from '@/components/ui/button.astro'
import Input from '@/components/ui/input.astro'
import Select from '@/components/ui/select.astro'
import Textarea from '@/components/ui/textarea.astro'

import { stylesheet, utility } from '../../test/helpers/css-tokens.ts'

const SIZES = ['sm', 'md', 'lg', 'xl'] as const
const MEASURES = [
  ...SIZES.flatMap((size) => [`control-${size}-height`, `control-${size}-font-size`]),
  'control-outline-border-width',
  'control-hover-mix',
  'control-ring-offset',
  'field-height',
  'field-font-size',
]
const ROLE_TOKENS = ['control-outline-border-color', 'field-focus-border-color', 'field-focus-shadow']
const FILLED = ['default', 'secondary', 'destructive', 'accent'] as const
const TRANSPARENT_BORDER = [...FILLED, 'soft', 'ghost'] as const
const OPTIONS = [{ value: 'a', label: 'A' }]
const FIELDS = [
  ['Input', Input, {}, 'input'],
  ['Textarea', Textarea, {}, 'textarea'],
  ['il nativo di Select', Select, { options: OPTIONS }, '[data-select-native]'],
  ['il trigger di Select', Select, { options: OPTIONS }, '[data-select-trigger]'],
] as const
const WRITTEN_MEASURE = /^(?:h|size|w)-\d|^text-(?:xs|sm|base|lg|\d?xl)$/

async function classesOf(
  component: Parameters<typeof renderToFragment>[0],
  props: Record<string, unknown> = {},
  selector = 'body > *',
): Promise<string[]> {
  const fragment = await renderToFragment(component, { props, slots: { default: 'Save' } })
  return (fragment.querySelector(selector)?.getAttribute('class') ?? '').split(' ')
}

const writtenMeasures = (classes: string[]) =>
  classes.filter((name) => WRITTEN_MEASURE.test(name.split(':').pop() ?? ''))

describe('i token dei controlli', () => {
  it.each(MEASURES)('tokens.css porta --%s', (token) => {
    expect(stylesheet('tokens.css')).toContain(`--${token}:`)
  })

  it.each(ROLE_TOKENS)(
    "light.css e dark.css portano --%s, così un'isola .dark lo ricalcola sui suoi ruoli",
    (token) => {
      expect(stylesheet('light.css')).toContain(`--${token}:`)
      expect(stylesheet('dark.css')).toContain(`--${token}:`)
    },
  )

  it("bg-hover-* mescola il ruolo con --control-hover-mix solo dove c'è color-mix()", () => {
    expect(utility('bg-hover-*')).toContain('@variant mix')
    expect(utility('bg-hover-*')).toContain('var(--control-hover-mix)')
  })

  it('field-text prende il corpo da --field-font-size', () => {
    expect(utility('field-text')).toContain('font-size: var(--field-font-size);')
  })
})

describe.each(SIZES)('taglia %s', (size) => {
  it(`control-${size} prende altezza e corpo dai token`, () => {
    expect(utility(`control-${size}`)).toContain(`height: var(--control-${size}-height);`)
    expect(utility(`control-${size}`)).toContain(`font-size: var(--control-${size}-font-size);`)
  })

  it.each([size, `icon-${size}`])(`Button size=%s porta control-${size} e nessuna misura sua`, async (buttonSize) => {
    const classes = await classesOf(Button, { size: buttonSize })

    expect(classes).toContain(`control-${size}`)
    expect(writtenMeasures(classes)).toEqual([])
  })
})

describe('Button', () => {
  it.each([
    ['default', 'primary'],
    ['destructive', 'destructive'],
  ])("%s prende l'hover da --control-hover-mix", async (variant, role) => {
    expect(await classesOf(Button, { variant })).toContain(`hover:bg-hover-${role}`)
  })

  it("outline disegna oltre il pixel del bordo con un'ombra interna, dai token del contorno", async () => {
    const classes = await classesOf(Button, { variant: 'outline' })

    expect(classes).toEqual(
      expect.arrayContaining([
        'border',
        'border-(--control-outline-border-color)',
        'inset-ring-[calc(var(--control-outline-border-width)-1px)]',
        'inset-ring-(--control-outline-border-color)',
      ]),
    )
  })

  it.each(TRANSPARENT_BORDER)(
    '%s porta un bordo trasparente, che con i contrasti forzati resta come contorno quando il fondo sparisce',
    async (variant) => {
      expect(await classesOf(Button, { variant })).toEqual(expect.arrayContaining(['border', 'border-transparent']))
    },
  )

  it.each(FILLED)("%s stacca l'anello del focus di --control-ring-offset, sul fondo", async (variant) => {
    expect(await classesOf(Button, { variant })).toEqual(
      expect.arrayContaining([
        'focus-visible:ring-offset-[length:var(--control-ring-offset)]',
        'focus-visible:ring-offset-background',
      ]),
    )
  })
})

describe.each(FIELDS)('%s', (_name, component, props, selector) => {
  it('prende corpo e forma del focus dai token, senza un anello e un corpo suoi', async () => {
    const classes = await classesOf(component, props, selector)

    expect(classes).toEqual(
      expect.arrayContaining([
        'field-text',
        'focus-visible:shadow-(--field-focus-shadow)',
        'focus-visible:border-(--field-focus-border-color)',
      ]),
    )
    expect(classes).not.toContain('focus-visible:ring-2')
    expect(writtenMeasures(classes)).toEqual([])
  })
})

it.each(FIELDS.filter(([name]) => name !== 'Textarea'))(
  "%s prende l'altezza da --field-height",
  async (_name, component, props, selector) => {
    expect(await classesOf(component, props, selector)).toContain('h-(--field-height)')
  },
)
