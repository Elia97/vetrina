import { vi } from 'vitest'

export function okResponse(): Response {
  return new Response(JSON.stringify({ messageId: 'abc' }), { status: 201 })
}

export type FetchMock = ReturnType<typeof vi.fn<typeof fetch>>

export function stubUncalledFetch(): FetchMock {
  const fetchMock = vi.fn<typeof fetch>()
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

export function stubResolvedFetch(response: Response): FetchMock {
  const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(response)
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

export function stubRejectedFetch(error: Error): FetchMock {
  const fetchMock = vi.fn<typeof fetch>().mockRejectedValue(error)
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}
