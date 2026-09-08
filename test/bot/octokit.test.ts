import { afterEach, describe, expect, it, vi } from 'vitest'
import nock from 'nock'
import { getReposInOrgGQL } from '../../src/bot/graphql'

describe('Octokit GitHub Enterprise configuration', () => {
  afterEach(() => {
    vi.resetModules()
    vi.unstubAllEnvs()
    vi.clearAllMocks()
    vi.doUnmock('bot')
    vi.doUnmock('probot')
  })

  it('configures REST and GraphQL endpoints for GHES', async () => {
    const { Octokit } = await import('../../src/bot/rest')
    const octokit = new Octokit({
      auth: 'token',
      baseUrl: 'https://ghes.example.com/api/v3',
      githubGraphQlUrl: 'https://ghes.example.com/api/graphql',
    })
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

  it('configures client-side personal Octokit from exposed endpoints', async () => {
    const { personalOctokit } = await import('../../src/bot/rest')
    const octokit = personalOctokit('token', {
      apiUrl: 'https://api.acme.ghe.com',
      graphQlUrl: 'https://api.acme.ghe.com/graphql',
    })
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

  it('paginates the app GraphQL query through the configured endpoint', async () => {
    const graphqlMock = nock('https://api.acme.ghe.com')
      .post('/graphql', {
        query: getReposInOrgGQL,
        variables: {
          login: 'acme',
          isFork: true,
        },
      })
      .reply(200, {
        data: {
          organization: {
            repositories: {
              totalCount: 2,
              nodes: [{ name: 'first' }],
              pageInfo: {
                hasNextPage: true,
                endCursor: 'next-page',
              },
            },
          },
        },
      })
      .post('/graphql', {
        query: getReposInOrgGQL,
        variables: {
          login: 'acme',
          isFork: true,
          cursor: 'next-page',
        },
      })
      .reply(200, {
        data: {
          organization: {
            repositories: {
              totalCount: 2,
              nodes: [{ name: 'second' }],
              pageInfo: {
                hasNextPage: false,
                endCursor: 'next-page',
              },
            },
          },
        },
      })

    const { personalOctokit } = await import('../../src/bot/rest')
    const result = await personalOctokit('token', {
      apiUrl: 'https://api.acme.ghe.com',
      graphQlUrl: 'https://api.acme.ghe.com/graphql',
    }).graphql.paginate<{
      organization: {
        repositories: {
          nodes: { name: string }[]
        }
      }
    }>(getReposInOrgGQL, {
      login: 'acme',
      isFork: true,
    })

    expect(result.organization.repositories.nodes).toEqual([
      { name: 'first' },
      { name: 'second' },
    ])
    expect(graphqlMock.isDone()).toBe(true)
  })

  it('uses the configured REST API base URL for app auth requests', async () => {
    vi.stubEnv('GITHUB_API_URL', 'https://ghes.example.com/api/v3')
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

  it('configures webhook Probot Octokit endpoints for GHES', async () => {
    vi.stubEnv('GITHUB_API_URL', 'https://ghes.example.com/api/v3')
    vi.stubEnv('GITHUB_GRAPHQL_URL', 'https://ghes.example.com/api/graphql')
    vi.resetModules()

    const createProbot = vi.fn((options) => options)
    const createNodeMiddleware = vi.fn()
    vi.doMock('bot', () => ({
      default: vi.fn(),
    }))
    vi.doMock('probot', async () => {
      const actual = await vi.importActual<typeof import('probot')>('probot')
      return {
        ...actual,
        createNodeMiddleware,
        createProbot,
      }
    })

    await import('../../src/pages/api/webhooks')

    expect(createProbot).toHaveBeenCalledTimes(1)
    const Octokit = createProbot.mock.calls[0][0].defaults.Octokit
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
})
