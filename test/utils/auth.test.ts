import { afterEach, describe, expect, it, vi } from 'vitest'

describe('generateAuthUrl', () => {
  afterEach(() => {
    vi.resetModules()
    vi.unstubAllEnvs()
  })

  it('uses the configured server scheme and host', async () => {
    vi.stubEnv('GITHUB_SERVER_URL', 'http://ghes.example.com:8080')
    vi.resetModules()
    const { generateAuthUrl } = await import('../../src/utils/auth')

    const authUrl = new URL(generateAuthUrl('token', 'owner', 'repo'))

    expect(authUrl.protocol).toBe('http:')
    expect(authUrl.host).toBe('ghes.example.com:8080')
    expect(authUrl.username).toBe('x-access-token')
    expect(authUrl.password).toBe('token')
    expect(authUrl.pathname).toBe('/owner/repo')
  })

  it('keeps the github.com default unchanged', async () => {
    delete process.env.GITHUB_SERVER_URL
    vi.resetModules()
    const { generateAuthUrl } = await import('../../src/utils/auth')

    const authUrl = new URL(generateAuthUrl('token', 'owner', 'repo'))

    expect(authUrl.protocol).toBe('https:')
    expect(authUrl.host).toBe('github.com')
    expect(authUrl.pathname).toBe('/owner/repo')
  })
})
