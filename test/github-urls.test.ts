import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  getCommitterEmailDomain,
  getGitHubApiUrl,
  getGitHubGraphQlUrl,
  getGitHubServerHost,
  getGitHubServerProtocol,
  getGitHubServerUrl,
  getOAuthAccessTokenUrl,
  getOAuthAuthorizationUrl,
  getOAuthIssuer,
} from '../src/utils/github-urls'

const ENV_KEYS = [
  'GITHUB_SERVER_URL',
  'GITHUB_API_URL',
  'GITHUB_GRAPHQL_URL',
  'NEXT_PUBLIC_GITHUB_SERVER_URL',
  'NEXT_PUBLIC_GITHUB_API_URL',
  'NEXT_PUBLIC_GITHUB_GRAPHQL_URL',
  'GITHUB_USER_EMAIL_DOMAIN',
] as const

describe('github-urls helpers', () => {
  const original: Record<string, string | undefined> = {}

  beforeEach(() => {
    for (const k of ENV_KEYS) {
      original[k] = process.env[k]
      delete process.env[k]
    }
  })

  afterEach(() => {
    for (const k of ENV_KEYS) {
      if (original[k] === undefined) {
        delete process.env[k]
      } else {
        process.env[k] = original[k]
      }
    }
  })

  describe('defaults (backward compatibility)', () => {
    it('returns github.com defaults when no env is set', () => {
      expect(getGitHubServerUrl()).toBe('https://github.com')
      expect(getGitHubApiUrl()).toBe('https://api.github.com')
      expect(getGitHubGraphQlUrl()).toBe('https://api.github.com/graphql')
      expect(getGitHubServerHost()).toBe('github.com')
      expect(getGitHubServerProtocol()).toBe('https:')
      expect(getOAuthAuthorizationUrl()).toBe(
        'https://github.com/login/oauth/authorize',
      )
      expect(getOAuthAccessTokenUrl()).toBe(
        'https://github.com/login/oauth/access_token',
      )
      expect(getOAuthIssuer()).toBe('https://github.com/login/oauth')
      expect(getCommitterEmailDomain()).toBe('users.noreply.github.com')
    })
  })

  describe('GHE.com Data Residency configuration', () => {
    it('uses explicitly configured API and GraphQL URLs', () => {
      process.env.GITHUB_SERVER_URL = 'https://acme.ghe.com'
      process.env.GITHUB_API_URL = 'https://api.acme.ghe.com'
      process.env.GITHUB_GRAPHQL_URL = 'https://api.acme.ghe.com/graphql'
      expect(getGitHubApiUrl()).toBe('https://api.acme.ghe.com')
      expect(getGitHubGraphQlUrl()).toBe('https://api.acme.ghe.com/graphql')
      expect(getGitHubServerHost()).toBe('acme.ghe.com')
      expect(getOAuthIssuer()).toBe('https://acme.ghe.com/login/oauth')
    })

    it('strips trailing slashes', () => {
      process.env.GITHUB_SERVER_URL = 'https://acme.ghe.com/'
      expect(getGitHubServerUrl()).toBe('https://acme.ghe.com')
    })
  })

  describe('GHES configuration', () => {
    it('uses explicitly configured REST and GraphQL URLs', () => {
      process.env.GITHUB_SERVER_URL = 'https://ghes.example.com'
      process.env.GITHUB_API_URL = 'https://ghes.example.com/api/v3'
      process.env.GITHUB_GRAPHQL_URL = 'https://ghes.example.com/api/graphql'
      expect(getGitHubApiUrl()).toBe('https://ghes.example.com/api/v3')
      expect(getGitHubGraphQlUrl()).toBe('https://ghes.example.com/api/graphql')
    })
  })

  describe('explicit overrides', () => {
    it('respects explicit GITHUB_API_URL and GITHUB_GRAPHQL_URL', () => {
      process.env.GITHUB_SERVER_URL = 'https://acme.ghe.com'
      process.env.GITHUB_API_URL = 'https://custom.api.example/v3'
      process.env.GITHUB_GRAPHQL_URL = 'https://custom.api.example/graphql'
      expect(getGitHubApiUrl()).toBe('https://custom.api.example/v3')
      expect(getGitHubGraphQlUrl()).toBe('https://custom.api.example/graphql')
    })

    it('does not derive the GraphQL endpoint from an explicit API override', () => {
      process.env.GITHUB_API_URL = 'https://ghes.example.com/api/v3'
      expect(getGitHubGraphQlUrl()).toBe('https://api.github.com/graphql')
    })

    it('prefers NEXT_PUBLIC_* over server-only env', () => {
      process.env.GITHUB_SERVER_URL = 'https://server.example'
      process.env.NEXT_PUBLIC_GITHUB_SERVER_URL = 'https://public.example'
      expect(getGitHubServerUrl()).toBe('https://public.example')
    })

    it('preserves a custom protocol from the configured server URL', () => {
      process.env.GITHUB_SERVER_URL = 'http://ghes.example.com:8080'
      expect(getGitHubServerProtocol()).toBe('http:')
      expect(getGitHubServerHost()).toBe('ghes.example.com:8080')
    })

    it('respects GITHUB_USER_EMAIL_DOMAIN override', () => {
      process.env.GITHUB_USER_EMAIL_DOMAIN = 'users.noreply.acme.ghe.com'
      expect(getCommitterEmailDomain()).toBe('users.noreply.acme.ghe.com')
    })
  })
})
