import { brevoMock } from '@test/helpers/actions'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/vendor/brevo', () => brevoMock)
vi.mock('botid/server', () => ({ checkBotId: vi.fn() }))

describe('server', () => {
  it("registra l'azione di contatto", async () => {
    const { contact } = await import('@/actions/contact')
    const { server } = await import('@/actions')

    expect(server.contact).toBe(contact)
  })
})
