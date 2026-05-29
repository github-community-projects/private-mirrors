/**
 * Helpers for resolving GitHub host/API/OAuth URLs.
 *
 * Supports github.com (default), GitHub Enterprise Cloud with Data Residency
 * (`*.ghe.com`) and GitHub Enterprise Server.
 *
 * All values fall back to github.com defaults so existing deployments are
 * unaffected.
 *
 * Note: these helpers may be imported from client bundles, so they may only
 * read `NEXT_PUBLIC_*` environment variables. Non-public variables are read
 * only via the dedicated server helpers below.
 */

const DEFAULT_SERVER_URL = 'https://github.com'
const DEFAULT_API_URL = 'https://api.github.com'
const DEFAULT_EMAIL_DOMAIN = 'users.noreply.github.com'
const GHES_API_V3_SUFFIX_REGEX = /\/api\/v3\/?$/
const isGithubDotComHost = (host: string) =>
  host === 'github.com' || host === 'www.github.com'

const stripTrailingSlash = (value: string) => value.replace(/\/+$/, '')

const safeUrl = (value: string | undefined | null): URL | null => {
  if (!value) return null
  try {
    return new URL(value)
  } catch {
    return null
  }
}

/**
 * Derives the GitHub REST/GraphQL API URL from a server URL.
 *
 * - `https://github.com` => `https://api.github.com`
 * - `https://<tenant>.ghe.com` => `https://api.<tenant>.ghe.com`
 * - anything else (GHES) => `<server>/api/v3`
 *
 * Keep this derivation in sync with the local fallback in
 * `scripts/webhook-relay.mjs`.
 */
export const deriveApiUrlFromServerUrl = (serverUrl: string): string => {
  const url = safeUrl(serverUrl)
  if (!url) return DEFAULT_API_URL

  const host = url.host.toLowerCase()

  if (isGithubDotComHost(host)) {
    return DEFAULT_API_URL
  }

  if (host === 'ghe.com' || host.endsWith('.ghe.com')) {
    return `${url.protocol}//api.${host}`
  }

  return `${url.protocol}//${url.host}/api/v3`
}

/**
 * Returns the base GitHub web URL (e.g. `https://github.com`).
 * Safe to call from both server and client code.
 */
export const getGitHubServerUrl = (): string => {
  const value =
    process.env.NEXT_PUBLIC_GITHUB_SERVER_URL ?? process.env.GITHUB_SERVER_URL
  return stripTrailingSlash(
    value && value.length > 0 ? value : DEFAULT_SERVER_URL,
  )
}

/**
 * Returns the base GitHub REST/GraphQL API URL (e.g. `https://api.github.com`).
 * Safe to call from both server and client code.
 */
export const getGitHubApiUrl = (): string => {
  const explicit =
    process.env.NEXT_PUBLIC_GITHUB_API_URL ?? process.env.GITHUB_API_URL
  if (explicit && explicit.length > 0) {
    return stripTrailingSlash(explicit)
  }
  return stripTrailingSlash(deriveApiUrlFromServerUrl(getGitHubServerUrl()))
}

/**
 * Returns the GraphQL endpoint URL (e.g. `https://api.github.com/graphql`).
 * Safe to call from both server and client code.
 */
export const getGitHubGraphQlUrl = (): string => {
  const apiUrl = getGitHubApiUrl()
  if (GHES_API_V3_SUFFIX_REGEX.test(apiUrl)) {
    return apiUrl.replace(GHES_API_V3_SUFFIX_REGEX, '/api/graphql')
  }
  return `${apiUrl}/graphql`
}

/**
 * Returns the hostname portion of the GitHub server URL (e.g. `github.com`).
 * Used to build authenticated git URLs.
 */
export const getGitHubServerHost = (): string => {
  return safeUrl(getGitHubServerUrl())?.host ?? 'github.com'
}

/**
 * Returns the scheme portion of the GitHub server URL (e.g. `https:`).
 * Used to build authenticated git URLs.
 */
export const getGitHubServerProtocol = (): string => {
  return safeUrl(getGitHubServerUrl())?.protocol ?? 'https:'
}

/**
 * Returns the OAuth authorize URL.
 */
export const getOAuthAuthorizationUrl = (): string =>
  `${getGitHubServerUrl()}/login/oauth/authorize`

/**
 * Returns the OAuth access token URL.
 */
export const getOAuthAccessTokenUrl = (): string =>
  `${getGitHubServerUrl()}/login/oauth/access_token`

/**
 * Returns the OAuth issuer URL.
 */
export const getOAuthIssuer = (): string =>
  `${getGitHubServerUrl()}/login/oauth`

/**
 * Returns the committer email domain used for sync commits.
 *
 * Defaults to `users.noreply.github.com` to keep github.com behavior identical.
 * For GHE/GHES, configure `GITHUB_USER_EMAIL_DOMAIN` explicitly (the exact
 * domain depends on the instance/tenant configuration and cannot be safely
 * derived). Server-only.
 */
export const getCommitterEmailDomain = (): string => {
  const value = process.env.GITHUB_USER_EMAIL_DOMAIN
  return value && value.length > 0 ? value : DEFAULT_EMAIL_DOMAIN
}
