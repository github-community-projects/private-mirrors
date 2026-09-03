import { afterEach, describe, expect, it, vi } from 'vitest'

const GITHUB_ENV_KEYS = [
  'GITHUB_SERVER_URL',
  'GITHUB_API_URL',
  'GITHUB_GRAPHQL_URL',
  'GITHUB_USER_EMAIL_DOMAIN',
] as const

describe('GitHub environment configuration', () => {
  afterEach(() => {
    vi.resetModules()
    vi.unstubAllEnvs()
  })

  it('provides github.com defaults', async () => {
    for (const key of GITHUB_ENV_KEYS) {
      delete process.env[key]
    }
    vi.resetModules()

    const { env } = await import('../env.mjs')

    expect(env.GITHUB_SERVER_URL).toBe('https://github.com')
    expect(env.GITHUB_API_URL).toBe('https://api.github.com')
    expect(env.GITHUB_GRAPHQL_URL).toBe('https://api.github.com/graphql')
    expect(env.GITHUB_USER_EMAIL_DOMAIN).toBe('users.noreply.github.com')
  })

  it('provides GitHub defaults when validation is skipped during builds', async () => {
    for (const key of GITHUB_ENV_KEYS) {
      delete process.env[key]
    }
    vi.stubEnv('SKIP_ENV_VALIDATIONS', 'true')
    vi.resetModules()

    const { env } = await import('../env.mjs')

    expect(env.GITHUB_SERVER_URL).toBe('https://github.com')
    expect(env.GITHUB_API_URL).toBe('https://api.github.com')
    expect(env.GITHUB_GRAPHQL_URL).toBe('https://api.github.com/graphql')
    expect(env.GITHUB_USER_EMAIL_DOMAIN).toBe('users.noreply.github.com')
  })

  it('validates and normalizes explicit endpoints', async () => {
    vi.stubEnv('GITHUB_SERVER_URL', 'https://ghes.example.com/')
    vi.stubEnv('GITHUB_API_URL', 'https://ghes.example.com/api/v3/')
    vi.stubEnv('GITHUB_GRAPHQL_URL', 'https://ghes.example.com/api/graphql/')
    vi.stubEnv('GITHUB_USER_EMAIL_DOMAIN', 'users.noreply.ghes.example.com')
    vi.resetModules()

    const { env } = await import('../env.mjs')

    expect(env.GITHUB_SERVER_URL).toBe('https://ghes.example.com')
    expect(env.GITHUB_API_URL).toBe('https://ghes.example.com/api/v3')
    expect(env.GITHUB_GRAPHQL_URL).toBe('https://ghes.example.com/api/graphql')
    expect(env.GITHUB_USER_EMAIL_DOMAIN).toBe('users.noreply.ghes.example.com')
  })
})
