import { afterEach, describe, expect, it, vi } from 'vitest'
import { generateAuthUrl } from '../../src/utils/auth'

describe('generateAuthUrl', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('uses the configured server scheme and host', () => {
    vi.stubEnv('GITHUB_SERVER_URL', 'http://ghes.example.com:8080')

    const authUrl = new URL(generateAuthUrl('token', 'owner', 'repo'))

    expect(authUrl.protocol).toBe('http:')
    expect(authUrl.host).toBe('ghes.example.com:8080')
    expect(authUrl.username).toBe('x-access-token')
    expect(authUrl.password).toBe('token')
    expect(authUrl.pathname).toBe('/owner/repo')
  })

  it('keeps the github.com default unchanged', () => {
    const authUrl = new URL(generateAuthUrl('token', 'owner', 'repo'))

    expect(authUrl.protocol).toBe('https:')
    expect(authUrl.host).toBe('github.com')
    expect(authUrl.pathname).toBe('/owner/repo')
  })
})
