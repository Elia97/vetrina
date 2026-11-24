import { describe, expect, it } from 'vitest'

import { isStagingSite, resolveSiteUrl } from '@/lib/site-url'

describe('resolveSiteUrl', () => {
  it('falls back to the template placeholder when SITE_URL is unset', () => {
    expect(resolveSiteUrl(undefined)).toBe('https://example.com')
  })

  it('falls back on an empty value instead of failing the build', () => {
    expect(resolveSiteUrl('')).toBe('https://example.com')
  })

  it('keeps only the origin, without a trailing slash', () => {
    expect(resolveSiteUrl('https://oguns.vercel.app/')).toBe('https://oguns.vercel.app')
  })

  it('rejects a value that is not a URL', () => {
    expect(() => resolveSiteUrl('oguns.vercel.app')).toThrow()
  })
})

describe('isStagingSite', () => {
  it('is staging on a Vercel address', () => {
    expect(isStagingSite('https://oguns-git-main.vercel.app')).toBe(true)
  })

  it('is not staging on the custom domain', () => {
    expect(isStagingSite('https://example.com')).toBe(false)
  })

  it('is not staging on a domain that only contains vercel.app', () => {
    expect(isStagingSite('https://vercel.app.example.com')).toBe(false)
  })
})
