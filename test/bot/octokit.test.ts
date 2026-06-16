import { afterEach, describe, expect, it, vi } from 'vitest'

describe('Octokit GitHub Enterprise configuration', () => {
  afterEach(() => {
    delete process.env.GITHUB_SERVER_URL
    delete process.env.GITHUB_API_URL
    delete process.env.GITHUB_GRAPHQL_URL
    delete process.env.NEXT_PUBLIC_GITHUB_SERVER_URL
    delete process.env.NEXT_PUBLIC_GITHUB_API_URL
    delete process.env.NEXT_PUBLIC_GITHUB_GRAPHQL_URL
    delete process.env.APP_ID
    delete process.env.CLIENT_ID
    delete process.env.CLIENT_SECRET
    delete process.env.PRIVATE_KEY
    vi.resetModules()
    vi.unstubAllEnvs()
    vi.clearAllMocks()
  })

  it('configures REST and GraphQL endpoints for GHES', async () => {
    process.env.GITHUB_SERVER_URL = 'https://ghes.example.com'
    process.env.GITHUB_API_URL = 'https://ghes.example.com/api/v3'
    process.env.GITHUB_GRAPHQL_URL = 'https://ghes.example.com/api/graphql'
    process.env.NEXT_PUBLIC_GITHUB_SERVER_URL = 'https://ghes.example.com'
    process.env.NEXT_PUBLIC_GITHUB_API_URL = 'https://ghes.example.com/api/v3'
    process.env.NEXT_PUBLIC_GITHUB_GRAPHQL_URL =
      'https://ghes.example.com/api/graphql'
    vi.resetModules()

    const { Octokit } = await import('../../src/bot/rest')
    const octokit = new Octokit({ auth: 'token' })
    const graphqlEndpoint = (
      octokit.graphql.endpoint as unknown as (options: { query: string }) => {
        url: string
      }
    )({ query: '{ viewer { login } }' })

    expect(octokit.request.endpoint.DEFAULTS.baseUrl).toBe(
      'https://ghes.example.com/api/v3',
    )
    expect(graphqlEndpoint.url).toBe('https://ghes.example.com/api/graphql')
  })

  it('uses NEXT_PUBLIC GitHub URLs for the client-side personal octokit GraphQL endpoint', async () => {
    process.env.NEXT_PUBLIC_GITHUB_SERVER_URL = 'https://acme.ghe.com'
    process.env.NEXT_PUBLIC_GITHUB_API_URL = 'https://api.acme.ghe.com'
    process.env.NEXT_PUBLIC_GITHUB_GRAPHQL_URL =
      'https://api.acme.ghe.com/graphql'
    vi.resetModules()

    const { personalOctokit } = await import('../../src/bot/octokit')
    const octokit = personalOctokit('token')
    const graphqlEndpoint = (
      octokit.graphql.endpoint as unknown as (options: { query: string }) => {
        url: string
      }
    )({ query: '{ viewer { login } }' })

    expect(octokit.request.endpoint.DEFAULTS.baseUrl).toBe(
      'https://api.acme.ghe.com',
    )
    expect(graphqlEndpoint.url).toBe('https://api.acme.ghe.com/graphql')
  })

  it('uses the configured REST API base URL for app auth requests', async () => {
    process.env.GITHUB_SERVER_URL = 'https://ghes.example.com'
    process.env.GITHUB_API_URL = 'https://ghes.example.com/api/v3'
    process.env.NEXT_PUBLIC_GITHUB_SERVER_URL = 'https://ghes.example.com'
    process.env.NEXT_PUBLIC_GITHUB_API_URL = 'https://ghes.example.com/api/v3'
    process.env.APP_ID = '123'
    process.env.CLIENT_ID = 'client-id'
    process.env.CLIENT_SECRET = 'client-secret'
    process.env.PRIVATE_KEY = 'private-key'
    vi.resetModules()

    const defaultsSpy = vi.fn().mockReturnValue('request-client')
    const authSpy = vi
      .fn()
      .mockReturnValue(vi.fn().mockResolvedValue({ token: 'generated-token' }))

    vi.doMock('@octokit/request', () => ({
      request: {
        defaults: defaultsSpy,
      },
    }))
    vi.doMock('@octokit/auth-app', () => ({
      createAppAuth: authSpy,
    }))
    vi.doMock('utils/pem', () => ({
      generatePKCS8Key: vi.fn().mockReturnValue('converted-private-key'),
    }))

    const { generateAppAccessToken } = await import('../../src/bot/octokit')

    await expect(generateAppAccessToken()).resolves.toBe('generated-token')
    expect(defaultsSpy).toHaveBeenCalledWith({
      baseUrl: 'https://ghes.example.com/api/v3',
    })
  })
})
